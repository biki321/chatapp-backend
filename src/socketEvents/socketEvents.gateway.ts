import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  // WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageDto } from '../chat/message.dto';
import { ChatService } from 'src/chat/chat.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import '../clientList';
import { clientList } from '../clientList';
import { UsePipes, ValidationPipe } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'https://chatapp3210.netlify.app'],
    credentials: true,
    exposedHeaders: ['Authorization'],
    // exposedHeaders: '*',
    // methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  },
})
export class SocketEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) {}

  @WebSocketServer()
  server: Server;

  verifyAccessToken(token: string, socket: Socket): string | null {
    try {
      const payload = this.jwtService.verify(token.split(' ')[1]);
      return payload.id;
    } catch (error) {
      socket
        // .to(socket.id)
        .emit('un_authenticated', { error: 'UnAuthenticated' });

      socket.disconnect();
    }
    return null;
  }

  handleConnection(socket: Socket) {
    const accessToken = socket.handshake.headers.authorization;
    const userId = this.verifyAccessToken(accessToken, socket);
    if (userId) {
      clientList[userId] = socket.id;
      socket.broadcast.emit('user_status', {
        userId: userId,
        online: true,
      });
    }
  }

  handleDisconnect(socket: Socket) {
    //delete entry from clientList

    Object.keys(clientList).forEach((key) => {
      if (socket.id === clientList[key]) {
        delete clientList[key];
        socket.broadcast.emit('user_status', {
          userId: key,
          online: false,
        });
      }
    });
  }

  // validation pipe is not working properly
  // it will throw error if any property missing but won't send error msg to client
  @UsePipes(new ValidationPipe())
  @SubscribeMessage('send_message')
  async handleMsgEvent(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: MessageDto,
  ) {
    //check authenticate or not

    // data = JSON.parse(data);

    const accessToken = socket.handshake.headers.authorization;
    const userId = this.verifyAccessToken(accessToken, socket);
    if (userId) {
      try {
        const message = await this.chatService.createMessage(data);

        //if otherUserId is online send the msg
        if (clientList[data.otherUserId]) {
          socket.to(clientList[data.otherUserId]).emit(`get_message`, message);
        }

        //update thread
        const thread = await this.chatService.findThread(
          message.userId,
          message.otherUserId,
        );

        if (thread.length > 0) {
          await this.chatService.updateThread(message);
        } else {
          await this.chatService.createThread(message);
        }
      } catch (error) {
        socket.emit('internal_server_error', {
          error: 'internal server error',
        });
      }

      // throw new WsException('unauthenticated');
      // socket.emit('message', 'hello client froms server');
    }
  }

  @SubscribeMessage('update_read')
  async handleUpdateRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    data: {
      userId: string;
      otherUserId: string;
      ids: string[];
    },
  ) {
    // const { data, ack } = this.chatService.extractRequest(args);
    // const data = args[0];

    try {
      const r = await this.chatService.updateRead(
        data.userId,
        data.otherUserId,
        data.ids,
      );

      //update thread
      await this.chatService.updateThreadRead(data.userId, data.otherUserId);

      //send the other user the read update if he/she is online
      clientList[data.otherUserId] &&
        socket.to(clientList[data.otherUserId]).emit(`get_read_update`, {
          // userId: data.userId,
          otherUserId: data.userId,
          // ids: data.ids,
        });

      // ack({ status: 'ok' });
    } catch (error) {
      // ack({ status: 'failed' });
    }
  }

  @SubscribeMessage('send_typing')
  async handleTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    data: {
      userId: string;
      otherUserId: string;
    },
  ) {
    clientList[data.otherUserId] &&
      socket.to(clientList[data.otherUserId]).emit(`get_typing`, {
        userId: data.otherUserId,
        otherUserId: data.userId,
      });
  }
}

//events client can listen to
// un_authenticated
// user_status
// get_message
// internal_server_error
// get_read_update

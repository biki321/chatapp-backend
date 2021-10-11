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

//events client can listen to
// un_authenticated
// user_status
// updated_thread
// get_message
// internal_server_error

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
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
    console.log('\ntoken at verifyAccessToken', token);

    try {
      const payload = this.jwtService.verify(token.split(' ')[1]);
      return payload.id;
    } catch (error) {
      console.log('disconnect socket at verifyAccessToken');
      socket
        .to(socket.id)
        .emit('un_authenticated', { error: 'UnAuthenticated' });
      socket.disconnect();
    }
    return null;
  }

  handleConnection(socket: Socket) {
    console.log('client trying to connect');
    const accessToken = socket.handshake.headers.authorization;
    const userId = this.verifyAccessToken(accessToken, socket);
    if (userId) {
      console.log('payload at token verify at ahndle connection', userId);
      clientList[userId] = socket.id;
      socket.broadcast.emit('user_status', {
        userId: userId,
        status: 'online',
      });
    }
  }

  handleDisconnect(socket: Socket) {
    //delete entry from clientList
    console.log('socket disconnected');
    Object.keys(clientList).forEach((key) => {
      if (socket.id === clientList[key]) {
        delete clientList[key];
        socket.broadcast.emit('user_status', {
          userId: key,
          status: 'offline',
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
    console.log('\nmessge at handleMsgEvent ');
    //check authenticate or not

    // data = JSON.parse(data);

    const accessToken = socket.handshake.headers.authorization;
    const userId = this.verifyAccessToken(accessToken, socket);
    if (userId) {
      console.log('payload at token verify at handle msg ', userId);
      console.log('\ndata at msg', data);

      try {
        const message = await this.chatService.createMessage(data);
        console.log('creted msg', message);
        if (clientList[data.otherUserId]) {
          socket.to(clientList[data.otherUserId]).emit('get_message', message);
          console.log('at send message');
          socket
            .to(clientList[data.otherUserId])
            .emit('updated_thread', message);
        }
      } catch (error) {
        console.log('error at handleMsg SKt', error);
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
    args: [
      {
        userId: string;
        otherUserId: string;
        ids: string[];
      },
      // ({ status: string }) => void,
    ],
  ) {
    // const { data, ack } = this.chatService.extractRequest(args);
    const data = args[0];
    console.log('data at update_read', data);
    try {
      const r = await this.chatService.updateRead(
        data.userId,
        data.otherUserId,
        data.ids,
      );
      console.log(r);
      // ack({ status: 'ok' });
    } catch (error) {
      // ack({ status: 'failed' });
    }
  }
}

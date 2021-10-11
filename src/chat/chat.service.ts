import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { clientList } from 'src/clientList';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { In, LessThan, Repository } from 'typeorm';
import { MessageDto } from './message.dto';
import { Message } from './message.enity';

// userId
// otherUserId
// id
// senderId
// text
// read

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly userSerivice: UsersService,
  ) {}

  getMessages(
    userId: string,
    otherUserId: string,
    lastTimeStamp?: string,
    take = 10,
  ): Promise<Message[]> {
    if (lastTimeStamp) {
      return this.messageRepository.find({
        where: {
          userId: userId,
          otherUserId: otherUserId,
          timestamp: LessThan(lastTimeStamp),
        },
        order: { timestamp: 'DESC' },
        take: take,
      });
    }
    return this.messageRepository.find({
      where: { userId: userId, otherUserId: otherUserId },
      order: { timestamp: 'DESC' },
      take: take,
    });
  }

  async createMessage(message: MessageDto): Promise<Message> {
    const msg = await this.messageRepository.save(message);
    await this.messageRepository.save({
      userId: msg.otherUserId,
      otherUserId: msg.userId,
      id: msg.id,
      senderId: msg.senderId,
      timestamp: msg.timestamp,
      text: msg.text,
      read: msg.read,
    });
    return msg;
  }

  async updateRead(userId: string, otherUserId: string, ids: string[]) {
    let r = await this.messageRepository.update(
      { userId: userId, otherUserId: otherUserId, id: In(ids) },
      {
        read: true,
      },
    );
    r = await this.messageRepository.update(
      { userId: otherUserId, otherUserId: userId, id: In(ids) },
      {
        read: true,
      },
    );
    console.log('update read at chat service', r);
    return r;
  }

  extractRequest(args: any) {
    if (Array.isArray(args)) {
      const [data, ack] = args;
      return { data, ack };
    } else {
      return {
        data: args,
        ack: () => {
          return;
        },
      };
    }
  }

  async threads(userId: string) {
    const msgs = await this.messageRepository.find({
      where: { userId: userId },
      relations: ['otherUser'],
      order: { timestamp: 'DESC' },
      take: 1,
    });
    const usersIds = msgs.map((e) => e.otherUserId);

    let users: User[] = [];
    // if (usersIds && usersIds.length > 0) {
    //   users = await this.userSerivice.findManyNotIds(usersIds);
    // } else {
    users = await this.userSerivice.findManyNotIds(usersIds);
    // }

    console.log('users at threads', users);

    const threads = msgs.map((e) => ({
      user: {
        ...e.otherUser,
        userOnline: clientList[e.otherUserId] ? true : false,
      },

      message: {
        userId: e.userId,
        otherUserId: e.otherUserId,
        id: e.id,
        senderId: e.senderId,
        text: e.text,
        read: e.read,
        timestamp: e.timestamp,
      },
    }));

    users.forEach((e) => {
      threads.push({
        user: { ...e, userOnline: clientList[e.id] ? true : false },
        message: null,
      });
    });

    console.log('threads', threads);

    return threads;
  }
}

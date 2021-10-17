import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { timestamp } from 'rxjs';
import { clientList } from 'src/clientList';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { MessageDto } from './message.dto';
import { Message } from './message.enity';
import { Thread } from './thread.entity';

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
    @InjectRepository(Thread)
    private readonly threadRepository: Repository<Thread>,
    private readonly userSerivice: UsersService,
  ) {}
  // 2021-10-14T06:31:14.710Z
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

  async createThread(message: Message) {
    await this.threadRepository.insert([
      {
        userId: message.userId,
        otherUserId: message.otherUserId,
        messageId: message.id,
        senderId: message.senderId,
        text: message.text.substr(0, 10),
        timestamp: message.timestamp,
        read: message.read,
      },
      {
        userId: message.otherUserId,
        otherUserId: message.userId,
        messageId: message.id,
        senderId: message.senderId,
        text: message.text.substr(0, 10),
        timestamp: message.timestamp,
        read: message.read,
      },
    ]);
  }

  async updateThread(message: Message) {
    await this.threadRepository.update(
      { userId: message.userId, otherUserId: message.otherUserId },
      {
        messageId: message.id,
        senderId: message.senderId,
        text: message.text.substr(0, 10),
        timestamp: message.timestamp,
        read: message.read,
      },
    );
    await this.threadRepository.update(
      { userId: message.otherUserId, otherUserId: message.userId },
      {
        messageId: message.id,
        senderId: message.senderId,
        text: message.text.substr(0, 10),
        timestamp: message.timestamp,
        read: message.read,
      },
    );
  }

  async updateThreadRead(userId: string, otherUserId: string) {
    await this.threadRepository.update(
      {
        userId: userId,
        otherUserId: otherUserId,
      },
      { read: true },
    );
    await this.threadRepository.update(
      {
        userId: otherUserId,
        otherUserId: userId,
      },
      { read: true },
    );
  }

  async findThread(userId: string, otherUserId: string) {
    return await this.threadRepository.find({
      where: { userId: userId, otherUserId: otherUserId },
    });
  }

  async updateRead(userId: string, otherUserId: string, ids: string[]) {
    let r = await this.messageRepository.update(
      { userId: userId, otherUserId: otherUserId, id: In(ids) },
      {
        read: true,
      },
    );
    r = await this.messageRepository.update(
      { userId: otherUserId, otherUserId: userId, read: false },
      {
        read: true,
      },
    );

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

  async getThreads(userId: string) {
    const threads = await this.threadRepository.find({
      where: { userId: userId },
      order: { timestamp: 'DESC' },
      relations: ['otherUser'],
    });

    const otherUsersIds = threads.map((thread) => thread.otherUser.id);
    otherUsersIds.push(userId);

    const usersExcludingSenders = await this.userSerivice.findManyNotIds(
      otherUsersIds,
    );

    const finalThreads = threads.map((thread) => ({
      otherUser: {
        ...thread.otherUser,
        online: clientList[thread.otherUserId] ? true : false,
      },
      threadMessage: {
        userId: thread.userId,
        otherUserId: thread.otherUserId,
        messageId: thread.messageId,
        senderId: thread.senderId,
        text: thread.text,
        timestamp: thread.timestamp,
        read: thread.read,
      },
    }));

    usersExcludingSenders.forEach((user) =>
      finalThreads.push({
        otherUser: { ...user, online: clientList[user.id] ? true : false },
        threadMessage: null,
      }),
    );
    return finalThreads;
  }
}

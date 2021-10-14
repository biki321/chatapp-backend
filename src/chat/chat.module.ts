import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './message.enity';
import { ChatService } from './chat.service';
import { UsersModule } from 'src/users/users.module';
import { ChatController } from './chat.controller';
import { Thread } from './thread.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Thread]), UsersModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

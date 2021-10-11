import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ChatService } from './chat.service';

@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatSerivce: ChatService) {}

  @Get('/messages/:otherUserId')
  getMessages(
    @Param('otherUserId') otherUserId: string,
    @Req() req: Request,
    @Query('lastTimeStamp') lastTimeStamp: string,
  ) {
    const userId = req.app.locals.user.id;
    console.log('lastTimeStamp at getMsgs', lastTimeStamp);
    return this.chatSerivce.getMessages(userId, otherUserId, lastTimeStamp);
  }

  @Get('/threads')
  getThreads(@Req() req: Request) {
    const userId = req.app.locals.user.id;
    return this.chatSerivce.threads(userId);
  }
}

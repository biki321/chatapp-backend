import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import '../clientList';
import { clientList } from '../clientList';

@Controller('api/v1/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUserById(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.usersService.findOneById(id);
    if (!user) {
      res.status(HttpStatus.NOT_FOUND);
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Not found',
      };
    }
    return { ...user, online: clientList[user.id] ? true : false };
  }
}

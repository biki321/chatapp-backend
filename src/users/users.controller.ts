import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CreateUserDto } from './create-user.dto';
import { UsersService } from './users.service';

@Controller('api/v1/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (await this.usersService.findOneByEmail(body.email)) {
      res.status(HttpStatus.NOT_ACCEPTABLE);
      return {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message: 'email already exist',
      };
    } else if (await this.usersService.findOneByUserName(body.username)) {
      res.status(HttpStatus.NOT_ACCEPTABLE);
      return {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        message: 'username already exist',
      };
    }

    return this.usersService.create(body);
  }

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
    return user;
  }
}

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { SignUpDto } from './signUp.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './login.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signUp/')
  async signUp(
    @Res({ passthrough: true }) response: Response,
    @Body() body: SignUpDto,
  ): Promise<any> {
    if (await this.usersService.findOneByUserName(body.username)) {
      response.status(HttpStatus.NOT_ACCEPTABLE);
      return {
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        error: 'username already exist',
      };
    }

    const hashedPassword = await this.authService.hashPassword(body.password);
    const user = await this.usersService.create(
      body.username,
      hashedPassword,
      body.gender,
    );
    response.cookie('erwty', await this.authService.createRefreshToken(user), {
      httpOnly: true,
    });
    response.set(
      'Authorization',
      await this.authService.createAccessToken(user),
    );
    // console.log('headers', response.getHeaders());
    return user;
  }

  @Post('login/')
  async login(
    @Res({ passthrough: true }) response: Response,
    @Body() body: LoginDto,
  ): Promise<any> {
    const user = await this.usersService.findOneByUserName(body.username);
    if (!user) {
      response.status(HttpStatus.NOT_FOUND);
      return {
        statusCode: HttpStatus.NOT_FOUND,
        error: 'user do not exist',
      };
    }

    if (await bcrypt.compare(body.password, user.password)) {
      response.cookie(
        'erwty',
        await this.authService.createRefreshToken(user),
        {
          httpOnly: true,
        },
      );
      response.set(
        'Authorization',
        await this.authService.createAccessToken(user),
      );
      // console.log('headers', response.getHeaders());
      return user;
    } else {
      response.status(HttpStatus.UNAUTHORIZED);
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'password did not match',
      };
    }
  }

  @Get('refreshToken')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log(request.cookies);
    const refreshToken = request.cookies['erwty'];
    if (!refreshToken) {
      response.set('Authorization', '').status(HttpStatus.UNAUTHORIZED);
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'you are not logged in',
      };
    }

    let payload: any = null;
    try {
      payload = this.authService.verifyRefreshToken(refreshToken);
    } catch (error) {
      console.log(error);
      response.set('Authorization', '').status(HttpStatus.UNAUTHORIZED);
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'you are not logged in',
      };
    }

    //refreshToken is valid so send a new accessToken and refreshToken
    const user = await this.usersService.findOneById(payload.id);

    if (!user) {
      response.set('Authorization', '').status(HttpStatus.UNAUTHORIZED);
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'you are not logged in',
      };
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      response.set('Authorization', '').status(HttpStatus.UNAUTHORIZED);
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'you are not logged in',
      };
    }

    response.cookie('erwty', await this.authService.createRefreshToken(user), {
      httpOnly: true,
    });
    response.set(
      'Authorization',
      await this.authService.createAccessToken(user),
    );
    // console.log('headers', response.getHeaders());
    return user;
  }

  @Get('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = request.app.locals.user.id;
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    user.tokenVersion = user.tokenVersion + 1;
    await this.usersService.save(user);

    response.clearCookie('erwty');
    response.status(HttpStatus.NO_CONTENT);
    return {
      statusCode: HttpStatus.NO_CONTENT,
    };
  }
}

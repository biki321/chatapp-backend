import { Injectable } from '@nestjs/common';
import { User } from 'src/users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  private readonly urlForToken = 'https://github.com/login/oauth/access_token';
  private readonly urlForProfile = 'https://api.github.com/user';

  async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(
      parseInt(this.configService.get('SALT_ROUND')),
    );
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  createAccessToken(user: User) {
    return this.jwtService.signAsync(
      { id: user.id, username: user.username },
      {
        expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRE'),
        // expiresIn: '5s',
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      },
    );
  }

  createRefreshToken(user: User) {
    return this.jwtService.signAsync(
      { id: user.id, tokenVersion: user.tokenVersion, username: user.username },
      {
        expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRE'),
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      },
    );
  }

  verifyAccessToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  verifyRefreshToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });
  }
}

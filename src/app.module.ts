import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { SocketEventsModule } from './socketEvents/socketEvents.module';
import { User } from './users/user.entity';
import { Message } from './chat/message.enity';
import { AuthenticationMiddleware } from './globalMiddleware/authentication.middleware';
import { UsersController } from './users/users.controller';
import { ChatController } from './chat/chat.controller';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { Thread } from './chat/thread.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE'),

        entities: [User, Message, Thread],
        synchronize: true, //this should be false in production
        // ssl: true,
        // extra: {
        //   ssl: {
        //     rejectUnauthorized: false,
        //   },
        // },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ChatModule,
    SocketEventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthenticationMiddleware)
      .exclude('auth')
      .forRoutes(UsersController, ChatController, {
        path: 'api/v1/auth/logout',
        method: RequestMethod.GET,
      });
  }
}

import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { AuthModule } from '../auth/auth.module';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from './constants';

@Module({
  imports: [AuthModule],
  providers: [
    WebsocketGateway,
    {
      provide: PUB_SUB,
      useValue: new PubSub(),
    },
  ],
  exports: [WebsocketGateway, PUB_SUB],
})
export class WebsocketModule {} 
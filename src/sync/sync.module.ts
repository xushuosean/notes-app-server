import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UserMiddleware } from 'src/middleware/user.middleware';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [HttpModule],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserMiddleware).forRoutes('/api/sync')
  }
}

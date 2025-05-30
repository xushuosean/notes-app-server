import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [AuthModule, SyncModule],
})
export class AppModule {}
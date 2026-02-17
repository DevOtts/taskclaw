import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LangfuseService } from './langfuse.service';
import { UsageController } from './usage.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [UsageController],
  providers: [LangfuseService],
  exports: [LangfuseService],
})
export class LangfuseModule {}

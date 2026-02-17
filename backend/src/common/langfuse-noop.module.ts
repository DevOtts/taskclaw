import { Global, Module } from '@nestjs/common';
import { LangfuseNoopService } from './langfuse-noop.service';
import { LangfuseService } from '../ee/langfuse/langfuse.service';

/**
 * Community edition replacement for LangfuseModule.
 * Provides a no-op LangfuseService so that injections don't break.
 */
@Global()
@Module({
  providers: [
    {
      provide: LangfuseService,
      useClass: LangfuseNoopService,
    },
  ],
  exports: [LangfuseService],
})
export class LangfuseNoopModule {}

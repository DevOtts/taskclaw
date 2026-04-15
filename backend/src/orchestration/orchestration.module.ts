import { Module, forwardRef } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { CommonModule } from '../common/common.module';
import { HeartbeatModule } from '../heartbeat/heartbeat.module';
import { BackboneModule } from '../backbone/backbone.module';
import { OrchestrationController } from './orchestration.controller';
import { OrchestrationService } from './orchestration.service';
import { DagTaskDispatcher } from './dag-task-dispatcher.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    SupabaseModule,
    CommonModule,
    HeartbeatModule,
    forwardRef(() => BackboneModule),
    WebhooksModule,
  ],
  controllers: [OrchestrationController],
  providers: [OrchestrationService, DagTaskDispatcher],
  exports: [OrchestrationService, DagTaskDispatcher],
})
export class OrchestrationModule {}

import { Module, forwardRef, OnModuleInit, Logger } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { CommonModule } from '../common/common.module';
import { BackboneModule } from '../backbone/backbone.module';
import { TasksModule } from '../tasks/tasks.module';
import { BoardRoutingModule } from '../board-routing/board-routing.module';
import { HeartbeatModule } from '../heartbeat/heartbeat.module';
import { PilotService } from './pilot.service';
import { PilotController } from './pilot.controller';
import { HeartbeatService } from '../heartbeat/heartbeat.service';

/**
 * PilotModule (BE15)
 *
 * Pod-level and workspace-level AI coordinator agent.
 * Reads boards + tasks, calls backbone, executes actions (create/move tasks, decompose goals).
 */
@Module({
  imports: [
    SupabaseModule,
    CommonModule,
    forwardRef(() => BackboneModule),
    forwardRef(() => TasksModule),
    forwardRef(() => BoardRoutingModule),
    HeartbeatModule,
  ],
  controllers: [PilotController],
  providers: [PilotService],
  exports: [PilotService],
})
export class PilotModule implements OnModuleInit {
  private readonly logger = new Logger(PilotModule.name);

  constructor(
    private readonly pilotService: PilotService,
    private readonly heartbeatService: HeartbeatService,
  ) {}

  onModuleInit() {
    // Wire PilotService into HeartbeatService to avoid circular dependency at module level
    this.heartbeatService.setPilotService(this.pilotService);
    this.logger.log('PilotService wired into HeartbeatService.');
  }
}

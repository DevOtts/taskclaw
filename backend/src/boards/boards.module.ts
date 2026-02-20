import { Module } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardStepsService } from './board-steps.service';
import { BoardTemplatesService } from './board-templates.service';
import { BoardsController } from './boards.controller';
import { BoardTemplatesController } from './board-templates.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [SupabaseModule, CommonModule],
  controllers: [BoardsController, BoardTemplatesController],
  providers: [BoardsService, BoardStepsService, BoardTemplatesService],
  exports: [BoardsService, BoardStepsService, BoardTemplatesService],
})
export class BoardsModule {}

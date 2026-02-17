import { Module } from '@nestjs/common';
import { AiProviderController } from './ai-provider.controller';
import { AiProviderService } from './ai-provider.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [SupabaseModule, CommonModule],
  controllers: [AiProviderController],
  providers: [AiProviderService],
  exports: [AiProviderService], // Export for use in ConversationsModule
})
export class AiProviderModule {}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Singleton Supabase admin service for use in non-request-scoped providers
 * (e.g. cron jobs, scheduled tasks). Uses the service role key to bypass RLS.
 */
@Injectable()
export class SupabaseAdminService {
  private adminClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.adminClient = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  getClient(): SupabaseClient {
    return this.adminClient;
  }
}

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { LangfuseService } from './langfuse.service';
import { SupabaseAdminService } from '../../supabase/supabase-admin.service';

@Controller('accounts/:accountId/usage')
@UseGuards(AuthGuard)
export class UsageController {
  constructor(
    private readonly langfuseService: LangfuseService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  /**
   * GET /accounts/:accountId/usage
   * Get AI usage summary for the account
   */
  @Get()
  async getUsageSummary(
    @Param('accountId') accountId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const client = this.supabaseAdmin.getClient();
    const summary = await this.langfuseService.getUsageSummary(
      accountId,
      client,
      days,
    );

    return {
      ...summary,
      langfuseEnabled: this.langfuseService.isEnabled(),
      period: `${days} days`,
    };
  }

  /**
   * GET /accounts/:accountId/usage/breakdown
   * Get usage broken down by task and category
   */
  @Get('breakdown')
  async getUsageBreakdown(
    @Param('accountId') accountId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const client = this.supabaseAdmin.getClient();
    return this.langfuseService.getUsageBreakdown(accountId, client, days);
  }

  /**
   * GET /accounts/:accountId/usage/task/:taskId
   * Get usage for a specific task
   */
  @Get('task/:taskId')
  async getTaskUsage(
    @Param('accountId') accountId: string,
    @Param('taskId') taskId: string,
  ) {
    const client = this.supabaseAdmin.getClient();
    return this.langfuseService.getTaskUsage(accountId, taskId, client);
  }
}

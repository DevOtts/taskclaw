import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseAdminService } from '../../supabase/supabase-admin.service';

/**
 * Plan feature limits.
 * Maps plan name → resource → max count.
 * -1 means unlimited.
 */
const PLAN_LIMITS: Record<string, Record<string, number>> = {
  Hobby: {
    sources: 2,
    categories: 5,
    tasks: 500,
    conversations: 50,
    knowledge_docs: 10,
    skills: 3,
    team_members: 1,
  },
  Pro: {
    sources: 10,
    categories: 25,
    tasks: 5000,
    conversations: -1,
    knowledge_docs: 100,
    skills: 20,
    team_members: 10,
  },
  Enterprise: {
    sources: -1,
    categories: -1,
    tasks: -1,
    conversations: -1,
    knowledge_docs: -1,
    skills: -1,
    team_members: -1,
  },
};

export const PLAN_RESOURCE_KEY = 'plan_resource';
export const PlanResource = (resource: string) =>
  SetMetadata(PLAN_RESOURCE_KEY, resource);

/**
 * PlanLimitGuard
 *
 * Use with @PlanResource('sources') decorator on POST endpoints
 * to enforce plan-based limits on resource creation.
 */
@Injectable()
export class PlanLimitGuard implements CanActivate {
  private readonly logger = new Logger(PlanLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Community edition has no plan limits — all features are unlimited
    if (process.env.EDITION !== 'cloud') return true;

    const resource = this.reflector.get<string>(
      PLAN_RESOURCE_KEY,
      context.getHandler(),
    );
    if (!resource) return true; // No resource decorator = no limit check

    const request = context.switchToHttp().getRequest();
    const accountId = request.params?.accountId;
    if (!accountId) return true;

    const db = this.supabaseAdmin.getClient();

    // Get account's current plan
    const { data: sub } = await db
      .from('subscriptions')
      .select('plan:plans(name)')
      .eq('account_id', accountId)
      .eq('status', 'active')
      .single();

    const planName = (sub as any)?.plan?.name || 'Hobby';
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.Hobby;
    const maxCount = limits[resource];

    if (maxCount === undefined || maxCount === -1) return true;

    // Count current resources
    const { count, error } = await db
      .from(resource)
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (error) {
      this.logger.error(`Failed to count ${resource}: ${error.message}`);
      return true; // Don't block on count errors
    }

    if ((count || 0) >= maxCount) {
      throw new ForbiddenException(
        `Plan limit reached: ${planName} plan allows up to ${maxCount} ${resource}. ` +
          `Please upgrade your plan to add more.`,
      );
    }

    return true;
  }
}

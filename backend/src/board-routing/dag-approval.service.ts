import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SupabaseAdminService } from '../supabase/supabase-admin.service';
import { DAGExecutorService } from './dag-executor.service';

@Injectable()
export class DagApprovalService {
  private readonly logger = new Logger(DagApprovalService.name);

  constructor(
    private readonly supabaseAdmin: SupabaseAdminService,
    @Inject(forwardRef(() => DAGExecutorService))
    private readonly dagExecutor: DAGExecutorService,
  ) {}

  /**
   * Create a pending approval record for a DAG.
   * Called automatically after decomposeGoal() creates the DAG.
   */
  async requestApproval(dagId: string): Promise<any> {
    const client = this.supabaseAdmin.getClient();

    // Verify DAG exists
    const { data: dag, error: dagError } = await client
      .from('task_dags')
      .select('id, account_id, goal, status')
      .eq('id', dagId)
      .single();

    if (dagError || !dag) {
      throw new NotFoundException(`DAG ${dagId} not found`);
    }

    // Insert approval record
    const { data: approval, error } = await client
      .from('dag_approvals')
      .insert({
        dag_id: dagId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create DAG approval: ${error.message}`);
    }

    this.logger.log(
      `DAG approval requested for DAG ${dagId} (goal: "${dag.goal}")`,
    );

    return approval;
  }

  /**
   * Get the current approval record for a DAG.
   */
  async getApproval(dagId: string): Promise<any> {
    const client = this.supabaseAdmin.getClient();

    const { data, error } = await client
      .from('dag_approvals')
      .select('*')
      .eq('dag_id', dagId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch DAG approval: ${error.message}`);
    }

    return data;
  }

  /**
   * Approve a DAG: update approval + task_dags + kick off execution.
   */
  async approve(dagId: string, userId: string, notes?: string): Promise<any> {
    const client = this.supabaseAdmin.getClient();

    // Fetch latest approval
    const approval = await this.getApproval(dagId);
    if (!approval) {
      throw new NotFoundException(`No approval record found for DAG ${dagId}`);
    }
    if (approval.status !== 'pending') {
      throw new BadRequestException(
        `DAG approval is already in status "${approval.status}"`,
      );
    }

    const now = new Date().toISOString();

    // Update approval to approved
    const { error: approvalError } = await client
      .from('dag_approvals')
      .update({
        status: 'approved',
        reviewer_user_id: userId,
        reviewed_at: now,
        notes: notes ?? null,
      })
      .eq('id', approval.id);

    if (approvalError) {
      throw new Error(`Failed to update approval: ${approvalError.message}`);
    }

    // Update task_dag: set approved_at + status = running
    const { data: dag, error: dagError } = await client
      .from('task_dags')
      .update({
        status: 'running',
        approved_at: now,
      })
      .eq('id', dagId)
      .select()
      .single();

    if (dagError) {
      throw new Error(`Failed to update DAG status: ${dagError.message}`);
    }

    this.logger.log(`DAG ${dagId} approved by ${userId} — starting execution`);

    // Fire-and-forget: execute DAG
    this.dagExecutor
      .startDag(dagId)
      .catch((err) =>
        this.logger.error(
          `DAG execution failed for ${dagId}: ${(err as Error).message}`,
        ),
      );

    return { dag, approval: { ...approval, status: 'approved' } };
  }

  /**
   * Reject a DAG: update approval + cancel task_dags.
   */
  async reject(dagId: string, userId: string, notes?: string): Promise<any> {
    const client = this.supabaseAdmin.getClient();

    // Fetch latest approval
    const approval = await this.getApproval(dagId);
    if (!approval) {
      throw new NotFoundException(`No approval record found for DAG ${dagId}`);
    }
    if (approval.status !== 'pending') {
      throw new BadRequestException(
        `DAG approval is already in status "${approval.status}"`,
      );
    }

    const now = new Date().toISOString();

    // Update approval to rejected
    const { error: approvalError } = await client
      .from('dag_approvals')
      .update({
        status: 'rejected',
        reviewer_user_id: userId,
        reviewed_at: now,
        notes: notes ?? null,
      })
      .eq('id', approval.id);

    if (approvalError) {
      throw new Error(`Failed to update approval: ${approvalError.message}`);
    }

    // Update task_dag: status = cancelled
    const { data: dag, error: dagError } = await client
      .from('task_dags')
      .update({ status: 'cancelled' })
      .eq('id', dagId)
      .select()
      .single();

    if (dagError) {
      throw new Error(`Failed to cancel DAG: ${dagError.message}`);
    }

    this.logger.log(`DAG ${dagId} rejected by ${userId}`);

    return { dag, approval: { ...approval, status: 'rejected' } };
  }
}

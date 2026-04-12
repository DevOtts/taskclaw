import { Injectable, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../supabase/supabase-admin.service';
import { BackboneRouterService } from '../backbone/backbone-router.service';

// Phrases that indicate the AI refused to act or requested more context.
// Tasks whose results match these patterns are marked "Needs Review" instead of "Done".
const REFUSAL_PATTERNS = [
  /i need (more |additional )?context/i,
  /please provide (more |additional )?context/i,
  /could you (please )?provide/i,
  /i don'?t have (enough |sufficient )?(context|information|details)/i,
  /i('?m| am) unable to (complete|perform|execute|do)/i,
  /i('?m| am) not able to (complete|perform|execute|do)/i,
  /i cannot (complete|perform|execute|access|do)/i,
  /i can'?t (complete|perform|execute|access|do)/i,
  /without (more |additional )?(context|information|details|access)/i,
  /more information (is |would be )?(needed|required)/i,
  /to (complete|perform|do) this (task|request|action)/i,
  /as an ai( language model| assistant)?,? i/i,
];

@Injectable()
export class DAGExecutorService {
  private readonly logger = new Logger(DAGExecutorService.name);

  constructor(
    private readonly supabaseAdmin: SupabaseAdminService,
    private readonly backboneRouter: BackboneRouterService,
  ) {}

  /**
   * Returns true when the AI response looks like a refusal / request for more context
   * rather than a genuine completion of the assigned task.
   */
  private isRefusalResponse(text: string): boolean {
    if (!text || text.trim().length === 0) return true;
    const trimmed = text.trim();
    // Very short responses (< 50 chars) that start with "I" are almost always refusals
    if (trimmed.length < 50 && /^I /i.test(trimmed)) return true;
    return REFUSAL_PATTERNS.some((re) => re.test(trimmed));
  }

  /**
   * Fetch the first board step (by position) for a given board instance.
   * Returns null when the board has no steps.
   */
  private async getFirstBoardStep(
    boardId: string,
  ): Promise<{ id: string; step_type: string } | null> {
    const client = this.supabaseAdmin.getClient();
    const { data } = await client
      .from('board_steps')
      .select('id, step_type')
      .eq('board_instance_id', boardId)
      .order('position', { ascending: true })
      .limit(1)
      .single();
    return data ?? null;
  }

  /**
   * Fetch the "done" board step for a given board instance.
   * Falls back to null when no done step exists.
   */
  private async getDoneBoardStep(
    boardId: string,
  ): Promise<{ id: string } | null> {
    const client = this.supabaseAdmin.getClient();
    const { data } = await client
      .from('board_steps')
      .select('id')
      .eq('board_instance_id', boardId)
      .eq('step_type', 'done')
      .limit(1)
      .single();
    return data ?? null;
  }

  /**
   * BE12: Execute an approved DAG by finding root tasks (no upstream deps)
   * and running them against the backbone. Uses cascading onTaskCompleted
   * to execute downstream tasks when upstreams complete.
   */
  async startDag(dagId: string): Promise<void> {
    const client = this.supabaseAdmin.getClient();

    // Fetch the DAG to get account_id
    const { data: dag, error: dagError } = await client
      .from('task_dags')
      .select('id, account_id, goal, status')
      .eq('id', dagId)
      .single();

    if (dagError || !dag) {
      this.logger.error(`startDag: DAG ${dagId} not found`);
      return;
    }

    // Fetch all tasks in this DAG
    const { data: allTasks } = await client
      .from('tasks')
      .select('id, title, notes, board_instance_id, completed')
      .eq('dag_id', dagId);

    if (!allTasks?.length) {
      this.logger.warn(`startDag: No tasks found in DAG ${dagId}`);
      return;
    }

    // Patch tasks that are missing current_step_id so they appear on their board
    for (const task of allTasks) {
      if (task.board_instance_id) {
        const firstStep = await this.getFirstBoardStep(task.board_instance_id);
        if (firstStep) {
          await client
            .from('tasks')
            .update({ current_step_id: firstStep.id })
            .eq('id', task.id)
            .is('current_step_id', null);
        }
      }
    }

    // Find tasks with no upstream dependencies (roots)
    const { data: allDeps } = await client
      .from('task_dependencies')
      .select('target_task_id')
      .eq('dag_id', dagId);

    const tasksWithUpstreams = new Set(
      (allDeps ?? []).map((d: any) => d.target_task_id),
    );

    const rootTasks = allTasks.filter(
      (t: any) => !tasksWithUpstreams.has(t.id) && !t.completed,
    );

    if (!rootTasks.length) {
      this.logger.log(`startDag: No root tasks to execute for DAG ${dagId}`);
      return;
    }

    this.logger.log(
      `startDag: Executing ${rootTasks.length} root task(s) for DAG ${dagId}`,
    );

    // Execute root tasks in batches of 3 (max concurrency)
    const BATCH_SIZE = 3;
    for (let i = 0; i < rootTasks.length; i += BATCH_SIZE) {
      const batch = rootTasks.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (task: any) => {
          try {
            const message =
              task.title + (task.notes ? '\n\n' + task.notes : '');

            const result = await this.backboneRouter.send({
              accountId: dag.account_id,
              boardId: task.board_instance_id ?? undefined,
              sendOptions: {
                message,
                systemPrompt:
                  'You are an AI task executor. Complete the task described.',
              },
            });

            const resultText = result.text ?? '';
            const isRefusal = this.isRefusalResponse(resultText);
            const finalStatus = isRefusal ? 'Needs Review' : 'Done';

            if (isRefusal) {
              this.logger.warn(
                `startDag: Task ${task.id} "${task.title}" returned a refusal — marking as Needs Review`,
              );
            }

            // Determine the correct step for the final status
            let finalStepId: string | undefined;
            if (!isRefusal && task.board_instance_id) {
              const doneStep = await this.getDoneBoardStep(
                task.board_instance_id,
              );
              if (doneStep) finalStepId = doneStep.id;
            }

            await client
              .from('tasks')
              .update({
                result: resultText,
                completed: !isRefusal,
                completed_at: isRefusal ? null : new Date().toISOString(),
                status: finalStatus,
                ...(finalStepId ? { current_step_id: finalStepId } : {}),
              })
              .eq('id', task.id);

            if (!isRefusal) {
              // Trigger cascade only for genuinely completed tasks
              await this.onTaskCompleted(task.id, resultText);
            }

            this.logger.log(
              `startDag: Task ${task.id} "${task.title}" → ${finalStatus}`,
            );
          } catch (err) {
            this.logger.error(
              `startDag: Task ${task.id} failed: ${(err as Error).message}`,
            );
            await this.onTaskFailed(task.id, (err as Error).message);
          }
        }),
      );
    }
  }

  async onTaskCompleted(taskId: string, result?: any) {
    const client = this.supabaseAdmin.getClient();

    // Store result if provided
    if (result) {
      await client.from('tasks').update({ result }).eq('id', taskId);
    }

    // Find downstream tasks
    const { data: deps } = await client
      .from('task_dependencies')
      .select('target_task_id, dag_id')
      .eq('source_task_id', taskId);

    if (!deps?.length) return;

    // Fetch dag account_id once (needed for backbone routing)
    const dagId = deps[0]?.dag_id;
    let dagAccountId: string | undefined;
    if (dagId) {
      const { data: dag } = await client
        .from('task_dags')
        .select('account_id')
        .eq('id', dagId)
        .single();
      dagAccountId = dag?.account_id;
    }

    const tasksToExecute: any[] = [];

    for (const dep of deps) {
      // Check if ALL upstreams of this downstream task are completed
      const { data: allUpstreamDeps } = await client
        .from('task_dependencies')
        .select('source_task_id')
        .eq('target_task_id', dep.target_task_id);

      if (!allUpstreamDeps?.length) continue;

      const { data: upstreamTasks } = await client
        .from('tasks')
        .select('id, status, completed')
        .in(
          'id',
          allUpstreamDeps.map((d) => d.source_task_id),
        );

      const allDone = upstreamTasks?.every(
        (t) => t.completed === true || t.status === 'Done',
      );

      if (allDone) {
        // Fetch full task data for execution
        const { data: downstreamTask } = await client
          .from('tasks')
          .select('id, title, notes, board_instance_id, completed, status')
          .eq('id', dep.target_task_id)
          .single();

        if (downstreamTask && !downstreamTask.completed) {
          this.logger.log(
            `All dependencies met for task ${dep.target_task_id}, executing "${downstreamTask.title}"`,
          );
          await client
            .from('tasks')
            .update({ status: 'In Progress' })
            .eq('id', dep.target_task_id);
          tasksToExecute.push(downstreamTask);
        }
      }
    }

    // Execute ready downstream tasks
    if (dagAccountId && tasksToExecute.length) {
      await Promise.all(
        tasksToExecute.map(async (task) => {
          try {
            const message =
              task.title + (task.notes ? '\n\n' + task.notes : '');
            const execResult = await this.backboneRouter.send({
              accountId: dagAccountId,
              boardId: task.board_instance_id ?? undefined,
              sendOptions: {
                message,
                systemPrompt:
                  'You are an AI task executor. Complete the task described.',
              },
            });

            const resultText = execResult.text ?? '';
            const isRefusal = this.isRefusalResponse(resultText);
            const finalStatus = isRefusal ? 'Needs Review' : 'Done';

            if (isRefusal) {
              this.logger.warn(
                `onTaskCompleted cascade: Task ${task.id} "${task.title}" returned a refusal — marking as Needs Review`,
              );
            }

            // Determine the correct step for the final status
            let finalStepId: string | undefined;
            if (!isRefusal && task.board_instance_id) {
              const doneStep = await this.getDoneBoardStep(
                task.board_instance_id,
              );
              if (doneStep) finalStepId = doneStep.id;
            }

            await client
              .from('tasks')
              .update({
                result: resultText,
                completed: !isRefusal,
                completed_at: isRefusal ? null : new Date().toISOString(),
                status: finalStatus,
                ...(finalStepId ? { current_step_id: finalStepId } : {}),
              })
              .eq('id', task.id);

            if (!isRefusal) {
              await this.onTaskCompleted(task.id, resultText);
            }

            this.logger.log(
              `onTaskCompleted cascade: Task ${task.id} "${task.title}" → ${finalStatus}`,
            );
          } catch (err) {
            this.logger.error(
              `onTaskCompleted cascade: Task ${task.id} failed: ${(err as Error).message}`,
            );
            await this.onTaskFailed(task.id, (err as Error).message);
          }
        }),
      );
    }

    // Check if the DAG is fully complete
    if (dagId) {
      await this.checkDagCompletion(dagId);
    }
  }

  async onTaskFailed(taskId: string, error: string) {
    const client = this.supabaseAdmin.getClient();

    // BFS to find all downstream tasks and mark as blocked
    const visited = new Set<string>();
    const queue = [taskId];

    while (queue.length) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const { data: deps } = await client
        .from('task_dependencies')
        .select('target_task_id')
        .eq('source_task_id', current);

      for (const dep of deps ?? []) {
        if (!visited.has(dep.target_task_id)) {
          await client
            .from('tasks')
            .update({
              status: 'Blocked',
            })
            .eq('id', dep.target_task_id);
          queue.push(dep.target_task_id);
        }
      }
    }
  }

  private async checkDagCompletion(dagId: string) {
    const client = this.supabaseAdmin.getClient();

    // Get all tasks in this DAG
    const { data: dagTasks } = await client
      .from('tasks')
      .select('id, completed, status')
      .eq('dag_id', dagId);

    if (!dagTasks?.length) return;

    // DAG is complete when every task is either Done or Needs Review (no more pending work)
    const allSettled = dagTasks.every(
      (t) =>
        t.completed === true ||
        t.status === 'Done' ||
        t.status === 'Needs Review' ||
        t.status === 'Blocked',
    );

    if (allSettled) {
      const hasNeedsReview = dagTasks.some((t) => t.status === 'Needs Review');
      const hasBlocked = dagTasks.some((t) => t.status === 'Blocked');
      const finalDagStatus = hasBlocked
        ? 'failed'
        : hasNeedsReview
          ? 'needs_review'
          : 'completed';

      this.logger.log(`DAG ${dagId} settled with status: ${finalDagStatus}`);
      await client
        .from('task_dags')
        .update({
          status: finalDagStatus,
          completed_at: new Date().toISOString(),
        })
        .eq('id', dagId);
    }
  }
}

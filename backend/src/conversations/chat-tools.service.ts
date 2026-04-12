import { Injectable, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../supabase/supabase-admin.service';
import { CoordinatorService } from '../board-routing/coordinator.service';
import { ToolContextDefinition } from '../backbone/adapters/backbone-adapter.interface';

export interface ChatToolContext {
  accountId: string;
  userId: string;
  accessToken: string;
  podId?: string;
  boardId?: string;
}

export interface ToolEntity {
  type: 'dag' | 'task' | 'board';
  id: string;
  title?: string;
  goal?: string;
  status?: string;
  pod_id?: string;
  board_id?: string;
}

export interface ToolOutcome {
  result: Record<string, any>;
  entity?: ToolEntity;
}

@Injectable()
export class ChatToolsService {
  private readonly logger = new Logger(ChatToolsService.name);

  constructor(
    private readonly supabaseAdmin: SupabaseAdminService,
    private readonly coordinator: CoordinatorService,
  ) {}

  getToolDefinitions(_ctx: ChatToolContext): ToolContextDefinition[] {
    return [
      {
        name: 'decompose_goal',
        description:
          'Decompose a high-level goal into a structured task DAG. Use this to create goals that appear in the Goals tab of a pod.',
        endpoint: '',
        method: 'internal',
        input_schema: {
          type: 'object',
          properties: {
            goal: {
              type: 'string',
              description: 'The goal to decompose into tasks',
            },
            pod_id: {
              type: 'string',
              description: 'Optional pod ID to associate the goal with',
            },
          },
          required: ['goal'],
        },
      },
      {
        name: 'create_task',
        description: 'Create a new task on a board',
        endpoint: '',
        method: 'internal',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Task title' },
            board_id: {
              type: 'string',
              description: 'Board ID to create the task on',
            },
            priority: {
              type: 'string',
              enum: ['High', 'Medium', 'Low'],
              description: 'Task priority',
            },
            notes: {
              type: 'string',
              description: 'Task description or notes',
            },
          },
          required: ['title', 'board_id'],
        },
      },
      {
        name: 'update_task',
        description: 'Update fields of an existing task',
        endpoint: '',
        method: 'internal',
        input_schema: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'ID of the task to update',
            },
            title: { type: 'string', description: 'New title' },
            priority: {
              type: 'string',
              enum: ['High', 'Medium', 'Low'],
            },
            notes: {
              type: 'string',
              description: 'New notes/description',
            },
            status: { type: 'string', description: 'New status' },
          },
          required: ['task_id'],
        },
      },
      {
        name: 'list_tasks',
        description:
          'List tasks from the account, optionally filtered by board',
        endpoint: '',
        method: 'internal',
        input_schema: {
          type: 'object',
          properties: {
            board_id: {
              type: 'string',
              description: 'Filter by board ID',
            },
            pod_id: {
              type: 'string',
              description: 'Filter tasks from all boards in a pod',
            },
            limit: {
              type: 'number',
              description: 'Max tasks to return (default 20)',
            },
          },
          required: [],
        },
      },
      {
        name: 'list_boards',
        description:
          'List boards in the account, optionally filtered by pod',
        endpoint: '',
        method: 'internal',
        input_schema: {
          type: 'object',
          properties: {
            pod_id: {
              type: 'string',
              description: 'Filter boards belonging to a specific pod',
            },
          },
          required: [],
        },
      },
    ];
  }

  async execute(
    toolName: string,
    input: Record<string, any>,
    ctx: ChatToolContext,
  ): Promise<ToolOutcome> {
    this.logger.log(`[ChatTools] Executing tool: ${toolName}`);
    const client = this.supabaseAdmin.getClient();

    switch (toolName) {
      case 'decompose_goal': {
        const { dag } = await this.coordinator.decomposeGoal({
          accountId: ctx.accountId,
          podId: input.pod_id || ctx.podId,
          goal: input.goal,
        });
        return {
          result: { dag_id: dag.id, status: dag.status, goal: dag.goal },
          entity: {
            type: 'dag',
            id: dag.id,
            goal: dag.goal,
            status: dag.status,
            pod_id: dag.pod_id,
          },
        };
      }

      case 'create_task': {
        const { data: task, error } = await client
          .from('tasks')
          .insert({
            account_id: ctx.accountId,
            title: input.title,
            board_instance_id: input.board_id,
            priority: input.priority || 'Medium',
            notes: input.notes || null,
            status: 'Todo',
          })
          .select('id, title, board_instance_id, priority')
          .single();
        if (error) throw new Error(`create_task failed: ${error.message}`);
        return {
          result: { task_id: task.id, title: task.title },
          entity: {
            type: 'task',
            id: task.id,
            title: task.title,
            board_id: task.board_instance_id,
          },
        };
      }

      case 'update_task': {
        const updates: Record<string, any> = {};
        if (input.title) updates.title = input.title;
        if (input.priority) updates.priority = input.priority;
        if (input.notes !== undefined) updates.notes = input.notes;
        if (input.status) updates.status = input.status;

        const { data: task, error } = await client
          .from('tasks')
          .update(updates)
          .eq('id', input.task_id)
          .eq('account_id', ctx.accountId)
          .select('id, title, board_instance_id')
          .single();
        if (error) throw new Error(`update_task failed: ${error.message}`);
        return {
          result: { task_id: task.id, updated: true },
          entity: {
            type: 'task',
            id: task.id,
            title: task.title,
            board_id: task.board_instance_id,
          },
        };
      }

      case 'list_tasks': {
        let query = client
          .from('tasks')
          .select(
            'id, title, status, priority, board_instance_id, board_instances(name)',
          )
          .eq('account_id', ctx.accountId)
          .order('created_at', { ascending: false })
          .limit(input.limit || 20);

        if (input.board_id)
          query = query.eq('board_instance_id', input.board_id);

        // If pod_id filter: get board IDs for that pod first
        if (input.pod_id) {
          const { data: boards } = await client
            .from('board_instances')
            .select('id')
            .eq('pod_id', input.pod_id)
            .eq('account_id', ctx.accountId);
          const boardIds = boards?.map((b: any) => b.id) ?? [];
          if (boardIds.length === 0) return { result: { tasks: [] } };
          query = query.in('board_instance_id', boardIds);
        }

        const { data: tasks, error } = await query;
        if (error) throw new Error(`list_tasks failed: ${error.message}`);
        return { result: { tasks: tasks ?? [] } };
      }

      case 'list_boards': {
        let query = client
          .from('board_instances')
          .select('id, name, description, pod_id')
          .eq('account_id', ctx.accountId)
          .order('name');

        if (input.pod_id) query = query.eq('pod_id', input.pod_id);

        const { data: boards, error } = await query;
        if (error) throw new Error(`list_boards failed: ${error.message}`);
        return { result: { boards: boards ?? [] } };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

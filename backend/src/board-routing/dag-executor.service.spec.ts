import { DAGExecutorService } from './dag-executor.service';
import { taskFixture } from '../__test__/fixtures/task.fixture';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeQueryChain(result: any, isSingle = true) {
  const chain: any = {};
  ['select', 'eq', 'is', 'order', 'limit', 'update'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  if (isSingle) {
    chain.single = jest.fn().mockResolvedValue({ data: result, error: null });
  }
  // Make it thenable for await queries
  chain.then = (resolve: any) => Promise.resolve({ data: result, error: null }).then(resolve);
  return chain;
}

function makeSupabaseAdmin(overrides: {
  dag?: any;
  tasks?: any[];
  deps?: any[];
  boardStep?: any;
  doneStep?: any;
} = {}) {
  return {
    getClient: jest.fn().mockReturnValue({
      from: jest.fn((table: string) => {
        switch (table) {
          case 'task_dags':
            return makeQueryChain(overrides.dag ?? { id: 'dag-1', account_id: 'account-1', goal: 'test', status: 'approved' });
          case 'tasks':
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              is: jest.fn().mockReturnThis(),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                is: jest.fn().mockResolvedValue({ data: null, error: null }),
                then: (resolve: any) => Promise.resolve({ data: null, error: null }).then(resolve),
              }),
              then: (resolve: any) =>
                Promise.resolve({ data: overrides.tasks ?? [], error: null }).then(resolve),
            };
          case 'task_dependencies':
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              then: (resolve: any) =>
                Promise.resolve({ data: overrides.deps ?? [], error: null }).then(resolve),
            };
          case 'board_steps': {
            const stepResult = makeQueryChain(overrides.boardStep ?? null);
            return stepResult;
          }
          default:
            return makeQueryChain(null);
        }
      }),
    }),
  };
}

function makeBackboneRouter(responseText = 'Task completed successfully with all requirements met.') {
  return {
    send: jest.fn().mockResolvedValue({ text: responseText, usage: { total_tokens: 50 } }),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('DAGExecutorService', () => {

  // ── isRefusalResponse() ──────────────────────────────────────
  // The method is private, so we test it through startDag() behavior
  // by checking whether tasks end up as "Needs Review" or "Done".
  // We also expose it indirectly via the service's behavior.

  describe('isRefusalResponse() — refusal pattern detection', () => {
    // Build a service with fully self-contained table routing (no originalFrom reference)
    function makeService(responseText: string) {
      const tasks = [taskFixture({ id: 't1', completed: false })];
      const updateCalls: any[] = [];
      const dagRow = { id: 'dag-1', account_id: 'account-1', goal: 'test', status: 'approved' };

      const makeTasksChain = () => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        update: jest.fn((data: any) => {
          updateCalls.push(data);
          const updateChain: any = {};
          updateChain.eq = jest.fn().mockReturnValue(updateChain);
          updateChain.is = jest.fn().mockReturnValue(updateChain);
          updateChain.then = (resolve: any) => Promise.resolve({ data: null, error: null }).then(resolve);
          return updateChain;
        }),
        then: (resolve: any) => Promise.resolve({ data: tasks, error: null }).then(resolve),
      });

      const supabaseAdmin = {
        getClient: jest.fn().mockReturnValue({
          from: jest.fn((table: string) => {
            switch (table) {
              case 'task_dags':
                return makeQueryChain(dagRow);
              case 'tasks':
                return makeTasksChain();
              case 'task_dependencies':
                return {
                  select: jest.fn().mockReturnThis(),
                  eq: jest.fn().mockReturnThis(),
                  then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
                };
              case 'board_steps':
                return makeQueryChain({ id: 'step-1', step_type: 'in_progress' });
              default:
                return makeQueryChain(null);
            }
          }),
        }),
      };

      return {
        service: new DAGExecutorService(supabaseAdmin as any, makeBackboneRouter(responseText) as any),
        updateCalls,
      };
    }

    const refusalTexts = [
      'I need more context to complete this task.',
      'Please provide more context about the project.',
      'Could you please provide additional details?',
      "I don't have enough context to proceed.",
      'I am unable to complete this task without more information.',
      'I cannot complete this task as described.',
      "I can't execute this without access to the codebase.",
      'Without more information, I cannot help.',
      'More information is needed to complete this request.',
      'As an AI language model, I cannot access external systems.',
      'I need help.', // < 50 chars starting with "I "
    ];

    refusalTexts.forEach((text) => {
      it(`marks task as "Needs Review" for refusal text: "${text.substring(0, 60)}"`, async () => {
        const { service, updateCalls } = makeService(text);
        await service.startDag('dag-1');
        const statusUpdate = updateCalls.find((u) => u.status !== undefined);
        expect(statusUpdate?.status).toBe('Needs Review');
        expect(statusUpdate?.completed).toBe(false);
      });
    });

    const normalResponses = [
      'I have analyzed the requirements and created a comprehensive implementation plan. The solution involves creating a new API endpoint that handles user authentication via JWT tokens.',
      'The database migration has been completed successfully. All tables have been updated with the new schema.',
      'Analysis complete: The root cause of the performance issue is an N+1 query in the user listing endpoint.',
    ];

    normalResponses.forEach((text) => {
      it(`marks task as "Done" for genuine response: "${text.substring(0, 60)}..."`, async () => {
        const { service, updateCalls } = makeService(text);
        await service.startDag('dag-1');
        // Find the update call that contains the status (may not be the last — onTaskCompleted
        // also updates the tasks table with just { result }).
        const statusUpdate = updateCalls.find((u) => u.status !== undefined);
        expect(statusUpdate?.status).toBe('Done');
        expect(statusUpdate?.completed).toBe(true);
      });
    });

    it('marks empty string response as "Needs Review"', async () => {
      const { service, updateCalls } = makeService('');
      await service.startDag('dag-1');
      const statusUpdate = updateCalls.find((u) => u.status !== undefined);
      expect(statusUpdate?.status).toBe('Needs Review');
    });
  });

  // ── startDag() — early return conditions ─────────────────────

  describe('startDag() — early return on invalid state', () => {
    it('returns early when DAG is not found', async () => {
      const supabaseAdmin = makeSupabaseAdmin({ dag: null });
      const backbone = makeBackboneRouter();
      const service = new DAGExecutorService(supabaseAdmin as any, backbone as any);

      await service.startDag('nonexistent-dag');
      expect(backbone.send).not.toHaveBeenCalled();
    });

    it('returns early when DAG has no tasks', async () => {
      const supabaseAdmin = makeSupabaseAdmin({ tasks: [] });
      const backbone = makeBackboneRouter();
      const service = new DAGExecutorService(supabaseAdmin as any, backbone as any);

      await service.startDag('dag-1');
      expect(backbone.send).not.toHaveBeenCalled();
    });

    it('returns early when all tasks are already completed (no root tasks)', async () => {
      const tasks = [taskFixture({ id: 't1', completed: true })];
      const supabaseAdmin = makeSupabaseAdmin({ tasks, deps: [] });
      const backbone = makeBackboneRouter();
      const service = new DAGExecutorService(supabaseAdmin as any, backbone as any);

      await service.startDag('dag-1');
      expect(backbone.send).not.toHaveBeenCalled();
    });
  });

  // ── startDag() — root task identification ────────────────────

  describe('startDag() — root task identification', () => {
    it('executes only tasks with no upstream dependencies', async () => {
      // t1 and t2 exist; t2 has an upstream dep (t1 → t2 means t2 is not a root)
      const tasks = [
        taskFixture({ id: 't1', completed: false }),
        taskFixture({ id: 't2', completed: false }),
      ];
      const supabaseAdmin = makeSupabaseAdmin({
        tasks,
        deps: [{ target_task_id: 't2' }], // t2 has upstream dependency
      });
      const backbone = makeBackboneRouter('Task done with full analysis and complete output.');
      const service = new DAGExecutorService(supabaseAdmin as any, backbone as any);

      await service.startDag('dag-1');

      // Only t1 should have been sent to backbone (it's the root)
      expect(backbone.send).toHaveBeenCalledTimes(1);
    });

    it('executes all tasks when none have upstream deps', async () => {
      const tasks = [
        taskFixture({ id: 't1', completed: false }),
        taskFixture({ id: 't2', completed: false }),
        taskFixture({ id: 't3', completed: false }),
      ];
      const supabaseAdmin = makeSupabaseAdmin({ tasks, deps: [] });
      const backbone = makeBackboneRouter('Task completed successfully with all requirements met.');
      const service = new DAGExecutorService(supabaseAdmin as any, backbone as any);

      await service.startDag('dag-1');
      expect(backbone.send).toHaveBeenCalledTimes(3);
    });
  });

  // ── startDag() — batch execution ─────────────────────────────

  describe('startDag() — batch execution limit', () => {
    it('processes root tasks in batches of max 3 concurrently', async () => {
      // 4 root tasks → first batch of 3, then 1 more
      const tasks = Array.from({ length: 4 }, (_, i) =>
        taskFixture({ id: `t${i + 1}`, completed: false }),
      );
      const supabaseAdmin = makeSupabaseAdmin({ tasks, deps: [] });

      const callOrder: number[] = [];
      let concurrentCount = 0;
      let maxConcurrent = 0;
      const backbone = {
        send: jest.fn().mockImplementation(async () => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);
          await new Promise((resolve) => setTimeout(resolve, 10));
          concurrentCount--;
          return { text: 'Task completed successfully with all details provided.', usage: { total_tokens: 10 } };
        }),
      };

      const service = new DAGExecutorService(supabaseAdmin as any, backbone as any);
      await service.startDag('dag-1');

      expect(backbone.send).toHaveBeenCalledTimes(4);
      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });
  });
});

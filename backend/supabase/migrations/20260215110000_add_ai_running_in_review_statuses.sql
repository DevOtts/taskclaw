-- Replace 'Review AI' with 'AI Running' + 'In Review' statuses.
-- 'AI Running' = AI is currently processing the task.
-- 'In Review' = AI completed or human moved task for review.
-- Also migrate any existing 'Review AI' tasks to 'In Review'.

UPDATE public.tasks SET status = 'In Review' WHERE status = 'Review AI';

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('To-Do', 'Today', 'In Progress', 'AI Running', 'In Review', 'Done', 'Blocked'));

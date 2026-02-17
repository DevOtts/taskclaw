-- Add 'Review AI' to the allowed task statuses for background AI processing
-- When a user sends a message to the AI assistant, the task automatically moves
-- to 'Review AI' once the AI finishes processing in the background.

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('To-Do', 'Today', 'In Progress', 'Review AI', 'Done', 'Blocked'));

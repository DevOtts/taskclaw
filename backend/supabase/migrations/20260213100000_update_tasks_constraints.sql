-- Update tasks table constraints to match Kanban board naming conventions
-- Status: To-Do, Today, In Progress, Done (matching the drag-and-drop columns)
-- Priority: High, Medium, Low (matching the UI labels)
-- category_id: make nullable for tasks without a category

-- 1. Drop existing CHECK constraints
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

-- 2. Add new CHECK constraints with Kanban-style values
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('To-Do', 'Today', 'In Progress', 'Done', 'Blocked'));

ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check
  CHECK (priority IN ('High', 'Medium', 'Low', 'Urgent'));

-- 3. Make category_id nullable (tasks can exist without a category)
ALTER TABLE public.tasks ALTER COLUMN category_id DROP NOT NULL;

-- 4. Update default values to match new naming
ALTER TABLE public.tasks ALTER COLUMN status SET DEFAULT 'To-Do';
ALTER TABLE public.tasks ALTER COLUMN priority SET DEFAULT 'Medium';

-- 5. Add metadata column to conversations (used for skill_ids and other context)
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

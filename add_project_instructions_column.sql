-- Instructions to add project_instructions column to events table
-- Run this SQL in your Supabase SQL Editor:

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS project_instructions text NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'project_instructions';

-- Test query to make sure everything works
SELECT id, title, project_instructions 
FROM public.events 
LIMIT 1;

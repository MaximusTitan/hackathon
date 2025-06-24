-- Add project_instructions column to events table
ALTER TABLE public.events 
ADD COLUMN project_instructions text NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.events.project_instructions IS 'Instructions for project submission that appear after passing screening test';

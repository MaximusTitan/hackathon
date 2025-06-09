-- Add TBA (To Be Announced) fields to events table
ALTER TABLE public.events 
ADD COLUMN date_tba boolean DEFAULT false,
ADD COLUMN time_tba boolean DEFAULT false,
ADD COLUMN venue_tba boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.events.date_tba IS 'When true, indicates that event date is to be announced';
COMMENT ON COLUMN public.events.time_tba IS 'When true, indicates that event time is to be announced';
COMMENT ON COLUMN public.events.venue_tba IS 'When true, indicates that event venue/location is to be announced';

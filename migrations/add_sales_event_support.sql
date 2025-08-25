-- Migration to add support for Sales Events
-- Add event_category column to events table
ALTER TABLE public.events 
ADD COLUMN event_category text DEFAULT 'hackathon' 
CHECK (event_category = ANY (ARRAY['hackathon'::text, 'sales'::text]));

-- Add video_link and sales_presentation_link columns to registrations table
ALTER TABLE public.registrations 
ADD COLUMN video_link text,
ADD COLUMN sales_presentation_link text;

-- Add comments for documentation
COMMENT ON COLUMN public.events.event_category IS 'Type of event: hackathon (traditional coding event) or sales (sales pitch/presentation event)';
COMMENT ON COLUMN public.registrations.video_link IS 'URL to sales pitch video (for sales events)';
COMMENT ON COLUMN public.registrations.sales_presentation_link IS 'URL to sales presentation materials (for sales events)';

-- Update existing events to have hackathon category by default (already set by DEFAULT)
-- This ensures backward compatibility

-- Optional: Create index for better performance on event category queries
CREATE INDEX IF NOT EXISTS idx_events_event_category ON public.events(event_category);

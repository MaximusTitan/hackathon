-- Add additional location fields for offline events
ALTER TABLE public.events 
  ADD COLUMN location_link text NULL,
  ADD COLUMN venue_name text NULL,
  ADD COLUMN address_line1 text NULL, 
  ADD COLUMN city text NULL,
  ADD COLUMN postal_code text NULL;

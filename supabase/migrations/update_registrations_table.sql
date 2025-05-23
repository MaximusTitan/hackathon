-- Add user details columns to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_linkedin TEXT;

-- Update existing registrations with user info from profiles
UPDATE public.registrations r
SET 
  user_name = p.name,
  user_email = p.email,
  user_linkedin = p.linkedin
FROM public.user_profiles p
WHERE r.user_id = p.id AND r.user_name IS NULL;

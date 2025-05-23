CREATE TABLE public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for admin_profiles
CREATE POLICY "Admins can view all admin profiles"
ON public.admin_profiles FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'admin');

CREATE POLICY "Admins can update their own profile"
ON public.admin_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Trigger to update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.admin_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

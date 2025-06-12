-- Drop existing recruiting_partners table if it exists
DROP TABLE IF EXISTS recruiting_partners CASCADE;

-- Create event_recruiting_partners table (event-specific)
CREATE TABLE IF NOT EXISTS event_recruiting_partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    website_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, name) -- Prevent duplicate partners for same event
);

-- Add RLS (Row Level Security)
ALTER TABLE event_recruiting_partners ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow everyone to read recruiting partners
CREATE POLICY "Anyone can view event recruiting partners" ON event_recruiting_partners
    FOR SELECT USING (true);

-- Only admins can insert recruiting partners
CREATE POLICY "Only admins can insert event recruiting partners" ON event_recruiting_partners
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                auth.users.raw_user_meta_data->>'role' = 'admin'
                OR auth.users.raw_user_meta_data->>'role' IS NULL
            )
        )
    );

-- Only admins can update recruiting partners
CREATE POLICY "Only admins can update event recruiting partners" ON event_recruiting_partners
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                auth.users.raw_user_meta_data->>'role' = 'admin'
                OR auth.users.raw_user_meta_data->>'role' IS NULL
            )
        )
    );

-- Only admins can delete recruiting partners
CREATE POLICY "Only admins can delete event recruiting partners" ON event_recruiting_partners
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                auth.users.raw_user_meta_data->>'role' = 'admin'
                OR auth.users.raw_user_meta_data->>'role' IS NULL
            )
        )
    );

-- Create storage bucket for recruiting logos (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recruiting-logos', 'recruiting-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for recruiting-logos bucket
-- Allow public read access
CREATE POLICY "Public read access for recruiting logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'recruiting-logos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload recruiting logos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'recruiting-logos' 
        AND auth.role() = 'authenticated'
        AND (
            EXISTS (
                SELECT 1 FROM auth.users
                WHERE auth.users.id = auth.uid()
                AND (
                    auth.users.raw_user_meta_data->>'role' = 'admin'
                    OR auth.users.raw_user_meta_data->>'role' IS NULL
                )
            )
        )
    );

-- Allow admins to delete recruiting logos
CREATE POLICY "Admins can delete recruiting logos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'recruiting-logos'
        AND (
            EXISTS (
                SELECT 1 FROM auth.users
                WHERE auth.users.id = auth.uid()
                AND (
                    auth.users.raw_user_meta_data->>'role' = 'admin'
                    OR auth.users.raw_user_meta_data->>'role' IS NULL
                )
            )
        )
    );

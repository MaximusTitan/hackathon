-- Create recruiting_partners table
CREATE TABLE IF NOT EXISTS recruiting_partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    website_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS (Row Level Security)
ALTER TABLE recruiting_partners ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow everyone to read recruiting partners
CREATE POLICY "Anyone can view recruiting partners" ON recruiting_partners
    FOR SELECT USING (true);

-- Only admins can insert recruiting partners
CREATE POLICY "Only admins can insert recruiting partners" ON recruiting_partners
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
CREATE POLICY "Only admins can update recruiting partners" ON recruiting_partners
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
CREATE POLICY "Only admins can delete recruiting partners" ON recruiting_partners
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

-- Insert default recruiting partners
INSERT INTO recruiting_partners (name, logo_url, website_url) VALUES
    ('Airs', 'https://ygogwzwqvsxataluhhsz.supabase.co/storage/v1/object/public/logo//airs-logo-new-1.avif', 'https://www.aireadyschool.com/'),
    ('igebra.ai', 'https://ygogwzwqvsxataluhhsz.supabase.co/storage/v1/object/public/logo//igebra.ai-logo-grey.png', 'https://www.igebra.ai/')
ON CONFLICT DO NOTHING;

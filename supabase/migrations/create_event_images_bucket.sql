-- Create a new storage bucket for event images
INSERT INTO storage.buckets (id, name)
VALUES ('event-images', 'event-images')
ON CONFLICT DO NOTHING;

-- Set up storage policy to allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  owner = auth.uid()
);

-- Allow public read access to event images
CREATE POLICY "Allow public read access to event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

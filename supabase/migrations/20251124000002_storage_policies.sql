-- Create evidence bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects is already default in Supabase, skipping explicit enable to avoid permission errors
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read Access
-- Allow anyone to view files in the evidence bucket
CREATE POLICY "Public Access Evidence"
ON storage.objects FOR SELECT
USING ( bucket_id = 'evidence' );

-- Policy: Authenticated Upload Access
-- Allow authenticated users to upload files to the evidence bucket
CREATE POLICY "Authenticated Upload Evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'evidence' );

-- Policy: Owner Update Access
-- Allow users to update their own files in the evidence bucket
CREATE POLICY "Owner Update Evidence"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'evidence' AND auth.uid() = owner );

-- Policy: Owner Delete Access
-- Allow users to delete their own files in the evidence bucket
CREATE POLICY "Owner Delete Evidence"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'evidence' AND auth.uid() = owner );

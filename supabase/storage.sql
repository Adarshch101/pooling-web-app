-- Create storage bucket for poll files
INSERT INTO storage.buckets (id, name, public)
VALUES ('poll-files', 'poll-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read files
CREATE POLICY "Public read access for poll files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'poll-files');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload poll files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'poll-files');

-- Allow admins to delete files
CREATE POLICY "Admins can delete poll files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'poll-files' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

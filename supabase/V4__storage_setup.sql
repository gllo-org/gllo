INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', TRUE);

CREATE POLICY "profile_images_upload" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "profile_images_read" ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'profile-images');

CREATE POLICY "profile_images_delete" ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'profile-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

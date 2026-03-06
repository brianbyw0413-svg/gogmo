-- 建立 Storage Bucket 用於存放司機證件
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('driver-docs', 'driver-docs', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 設定 Storage Policy
CREATE POLICY "public_read_driver_docs" ON storage.objects FOR SELECT USING (bucket_id = 'driver-docs');
CREATE POLICY "authenticated_upload_driver_docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'driver-docs' AND auth.role() = 'authenticated');
CREATE POLICY "authenticated_update_driver_docs" ON storage.objects FOR UPDATE USING (bucket_id = 'driver-docs' AND auth.role() = 'authenticated');
CREATE POLICY "admin_manage_driver_docs" ON storage.objects FOR ALL USING (
  bucket_id = 'driver-docs' AND 
  EXISTS (SELECT 1 FROM public.admins WHERE username = auth.jwt() ->> 'email')
);

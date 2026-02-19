-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', true) ON CONFLICT DO NOTHING;

-- Avatars: public read, authenticated users can upload
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Member photos: public read, authenticated users can upload
CREATE POLICY "member_photos_select" ON storage.objects FOR SELECT USING (bucket_id = 'member-photos');
CREATE POLICY "member_photos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'member-photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "member_photos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'member-photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "member_photos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'member-photos' AND auth.uid() IS NOT NULL);

-- Enable real-time for members table
ALTER TABLE public.members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;

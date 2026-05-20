-- Storage buckets used by Rescuenect image uploads.
-- Run this in the Supabase project that your backend points to.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'announcement-thumbnails',
    'announcement-thumbnails',
    true,
    52428800,
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'status-images',
    'status-images',
    true,
    52428800,
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'evacuation-centers',
    'evacuation-centers',
    true,
    52428800,
    array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read announcement thumbnails" on storage.objects;
create policy "Public read announcement thumbnails"
on storage.objects
for select
to public
using (bucket_id = 'announcement-thumbnails');

drop policy if exists "Public read status images" on storage.objects;
create policy "Public read status images"
on storage.objects
for select
to public
using (bucket_id = 'status-images');

drop policy if exists "Public read evacuation center images" on storage.objects;
create policy "Public read evacuation center images"
on storage.objects
for select
to public
using (bucket_id = 'evacuation-centers');

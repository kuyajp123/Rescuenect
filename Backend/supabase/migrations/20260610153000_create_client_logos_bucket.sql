-- Storage bucket for LGU client logos shown in the resident mobile contacts screen.
-- Logos are public PNG assets uploaded only by authenticated admin backend routes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'client-logos',
    'client-logos',
    true,
    2097152,
    array['image/png']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read client logos" on storage.objects;

-- Public buckets can serve object URLs without a broad storage.objects SELECT policy.
-- Keeping this bucket policy-free avoids allowing clients to list every logo file.

-- Storage bucket for LGU carousel slide images displayed on the resident mobile home screen.
-- Images are public assets uploaded only by authenticated admin backend routes.
-- Bucket is set to public so slide image URLs can be served without signed URLs.
--
-- Security Advisor note:
--   Supabase flags public buckets in the Security Advisor as a potential listing risk.
--   We intentionally do NOT add a broad "storage.objects SELECT" policy here, which
--   would allow any client to enumerate (list) every file in the bucket.
--   Public buckets can already serve known object URLs without such a policy, so
--   omitting it avoids the listing exposure while keeping images publicly accessible.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'carousel-slides',
  'carousel-slides',
  true,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public            = excluded.public,
  file_size_limit   = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Drop any accidental broad listing policy that may have been created previously.
drop policy if exists "Public read carousel slides" on storage.objects;

-- NOTE: We deliberately omit a SELECT policy on storage.objects for this bucket.
-- Public buckets serve known object URLs without one; adding it would allow clients
-- to list every file path in the bucket, which triggers the Security Advisor warning.

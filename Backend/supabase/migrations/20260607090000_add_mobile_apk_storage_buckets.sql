-- Storage buckets used by Rescuenect Android APK delivery.
-- Backend uploads use the Supabase service role key, so no public upload policy is needed.
-- Public buckets can serve files through public URLs without a storage.objects SELECT policy.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'mobile-app-releases',
    'mobile-app-releases',
    true,
    262144000,
    array[
      'application/vnd.android.package-archive',
      'application/octet-stream',
      'application/zip'
    ]
  ),
  (
    'mobile-app-releases-staging',
    'mobile-app-releases-staging',
    true,
    262144000,
    array[
      'application/vnd.android.package-archive',
      'application/octet-stream',
      'application/zip'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read mobile app releases" on storage.objects;
drop policy if exists "Public read staging mobile app releases" on storage.objects;
drop policy if exists "Public upload mobile app releases" on storage.objects;
drop policy if exists "Public upload staging mobile app releases" on storage.objects;

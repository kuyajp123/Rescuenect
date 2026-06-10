-- Remove broad public listing permissions from the public client logos bucket.
-- Public buckets can still serve known object URLs without this SELECT policy.

drop policy if exists "Public read client logos" on storage.objects;

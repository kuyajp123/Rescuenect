-- Supabase public buckets do not need broad storage.objects SELECT policies for public object URLs.
-- Dropping this policy resolves the "Public Bucket Allows Listing" advisor warning.

drop policy if exists "Public read client logos" on storage.objects;

-- Remove broad public listing permissions from public storage buckets.
-- Public buckets can still serve files through public URLs without these SELECT policies.

drop policy if exists "Public read announcement thumbnails" on storage.objects;
drop policy if exists "Public read status images" on storage.objects;
drop policy if exists "Public read evacuation center images" on storage.objects;

-- Keep the helper function from being callable through the public REST/RPC API.
-- If backend code ever needs this function, grant EXECUTE only to the exact backend role.

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

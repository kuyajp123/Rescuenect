alter table public.server_wakeup_settings enable row level security;

revoke all on public.server_wakeup_settings from anon, authenticated;
grant select, insert, update, delete on public.server_wakeup_settings to service_role;

drop policy if exists "Service role can manage server wakeup settings" on public.server_wakeup_settings;

create policy "Service role can manage server wakeup settings"
on public.server_wakeup_settings
for all
to service_role
using (true)
with check (true);

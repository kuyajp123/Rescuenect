create schema if not exists vault;
create extension if not exists supabase_vault with schema vault;
create extension if not exists pg_net;
create extension if not exists pg_cron;

create table if not exists public.server_wakeup_settings (
  id text primary key default 'default',
  enabled boolean not null default false,
  job_name text not null default 'server-wakeup-every-13-minutes',
  cron_expression text not null default '*/13 * * * *',
  interval_minutes integer not null default 13,
  updated_at timestamptz not null default now()
);

insert into public.server_wakeup_settings (id)
values ('default')
on conflict (id) do nothing;

create or replace function public.get_server_wakeup_status()
returns jsonb
language plpgsql
security definer
set search_path = public, cron, vault, net
as $$
declare
  settings_row public.server_wakeup_settings%rowtype;
  scheduled_job record;
begin
  select * into settings_row
  from public.server_wakeup_settings
  where id = 'default';

  select jobid, jobname, schedule, active
  into scheduled_job
  from cron.job
  where jobname = settings_row.job_name
  limit 1;

  return jsonb_build_object(
    'enabled', coalesce(scheduled_job.active, false),
    'jobId', scheduled_job.jobid,
    'jobName', settings_row.job_name,
    'cron', settings_row.cron_expression,
    'intervalMinutes', settings_row.interval_minutes,
    'scheduled', scheduled_job.jobid is not null,
    'updatedAt', settings_row.updated_at
  );
end;
$$;

create or replace function public.set_server_wakeup_enabled(p_enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, cron, vault, net
as $$
declare
  job_name constant text := 'server-wakeup-every-13-minutes';
  cron_expression constant text := '*/13 * * * *';
  existing_job_id integer;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = job_name
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(job_name);
  end if;

  if p_enabled then
    perform cron.schedule(
      job_name,
      cron_expression,
      $schedule$
      select
        net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'server_wakeup_project_url') || '/functions/v1/server-wakeup',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'server_wakeup_publishable_key')
          ),
          body := jsonb_build_object(
            'source', 'pg_cron',
            'scheduledAt', now()
          )
        ) as request_id;
      $schedule$
    );
  end if;

  insert into public.server_wakeup_settings (
    id,
    enabled,
    job_name,
    cron_expression,
    interval_minutes,
    updated_at
  )
  values ('default', p_enabled, job_name, cron_expression, 13, now())
  on conflict (id) do update set
    enabled = excluded.enabled,
    job_name = excluded.job_name,
    cron_expression = excluded.cron_expression,
    interval_minutes = excluded.interval_minutes,
    updated_at = excluded.updated_at;

  return public.get_server_wakeup_status();
end;
$$;

revoke all on function public.get_server_wakeup_status() from public, anon, authenticated;
revoke all on function public.set_server_wakeup_enabled(boolean) from public, anon, authenticated;
grant execute on function public.get_server_wakeup_status() to service_role;
grant execute on function public.set_server_wakeup_enabled(boolean) to service_role;

# Server Wakeup Function

Calls the backend health check endpoint so the hosted server stays warm.

## Deploy

```bash
cd Backend
supabase secrets set SERVER_WAKEUP_URL=https://rescuenect-backend.onrender.com
supabase functions deploy server-wakeup
```

Then add the Vault secrets below and run:

```bash
supabase db push
```

The scheduled job is created by `supabase/migrations/20260519010000_schedule_server_wakeup.sql` and runs every 13 minutes.

## Optional Endpoints

By default, the function calls only `/health`. To call more health checks, set a comma-separated list:

```bash
supabase secrets set SERVER_WAKEUP_ENDPOINTS=/health,/health/firebase,/health/full
```

If the backend host takes longer to wake up, increase the request timeout:

```bash
supabase secrets set SERVER_WAKEUP_TIMEOUT_MS=60000
```

## Required Vault Secrets For The Cron Job

The cron job invokes this Edge Function through Supabase, so store the project URL and publishable key in Vault:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'server_wakeup_project_url');
select vault.create_secret('<your-supabase-publishable-key>', 'server_wakeup_publishable_key');
```

## Turn Off Later

```sql
select cron.unschedule('server-wakeup-every-13-minutes');
```

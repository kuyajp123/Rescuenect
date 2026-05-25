# Tomorrow.io API usage limits

## Free tier limits

- Requests per second: 3
- Requests per hour: 25
- Requests per day: 500

## How your usage is counted

- Each scheduled weather function makes one Tomorrow.io request per location it processes.
- Locations come from active clients plus any static weather location keys.
- Realtime fetch retries can add extra requests during temporary failures.

## Scheduling considerations

- Hourly, daily, and realtime functions are separate runs; each run loops through all locations.
- If multiple weather functions start in the same minute, the combined burst must still stay under the per-second limit.
- Staggering schedules or adding per-run delays helps keep within the per-second limit.

## Scheduled runs (Tomorrow.io only)

- Realtime: every 30 minutes
- Hourly: every hour
- Daily: every 12 hours

## Estimated usage (2 LGU clients)

- Realtime: 96 requests/day
- Hourly: 48 requests/day
- Daily: 4 requests/day
- Total: 148 requests/day
- Busiest hours: 00:00 and 12:00, about 8 requests/hour

## Max LGU clients on free tier

- You can support up to 6 LGU clients on the free tier with the current schedules.
- Any static weather location keys count toward this total.
- Realtime retries can add extra requests during failures, so leave some headroom.

## Notes

- These limits apply to your Tomorrow.io account and are shared across all functions using the same API key.
- Monitor logs and Tomorrow.io usage dashboards to confirm actual consumption and adjust schedules if needed.

curl -i --location --request POST 'https://zepxowlolivaarxfcyxy.supabase.co/functions/v1/status-cleanup' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcHhvd2xvbGl2YWFyeGZjeXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzcyMTksImV4cCI6MjA3NTU1MzIxOX0.vmMCSaZKH07n-Baq5gKJOfZawPj3EIkSK1HUJSiQ5CU' \
  --header 'Content-Type: application/json' \
  --data '{}'

curl -i --location --request POST 'https://zepxowlolivaarxfcyxy.supabase.co/functions/v1/status-expire' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcHhvd2xvbGl2YWFyeGZjeXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzcyMTksImV4cCI6MjA3NTU1MzIxOX0.vmMCSaZKH07n-Baq5gKJOfZawPj3EIkSK1HUJSiQ5CU' \
  --header 'Content-Type: application/json' \
  --data '{}'


### Setting secrets edge functions
npx supabase secrets set SERVICE_ACCOUNT_KEY="your-service-account-key"

### deploying edge functions
npx supabase functions deploy status-cleanup
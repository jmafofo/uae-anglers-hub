-- Allow the retention cron (service role) to expire boosts.
-- The function exists from add_monetisation.sql but harden_function_grants.sql
-- revoked execute; nothing called it until now.
grant execute on function public.expire_boosts() to service_role;

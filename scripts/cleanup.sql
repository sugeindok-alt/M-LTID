-- Run deliberately against the intended database after agreeing retention policy.
-- Does not delete user accounts, favorites, shopping lists, or preferences.
DELETE FROM off_product_cache WHERE expires_at < now() - interval '7 days';
DELETE FROM request_limits WHERE expires_at < now() - interval '1 day';
DELETE FROM auth_rate_limits WHERE last_request < extract(epoch from now() - interval '7 days') * 1000;
DELETE FROM verifications WHERE expires_at < now() - interval '1 day';
DELETE FROM sessions WHERE expires_at < now() - interval '7 days';
-- Keep import idempotency keys long enough that delayed retries cannot add twice.
DELETE FROM shopping_imports WHERE created_at < now() - interval '90 days';
DELETE FROM email_send_records WHERE created_at < now() - interval '90 days';

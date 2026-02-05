-- Upgrade zwoodward@gmail.com to enterprise tier for admin access
UPDATE profiles
SET subscription_tier = 'enterprise',
    subscription_status = 'active',
    updated_at = now()
WHERE email = 'zwoodward@gmail.com';

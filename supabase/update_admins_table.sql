-- =============================================================================
-- Cyber Kovai: Supabase Admins Table Schema & Master Credentials Update
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nlopwybyiwmsypkrsogc/sql
-- =============================================================================

-- 1. Add backup_codes column to admins table if not already present
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "backup_codes" TEXT DEFAULT NULL;

-- 2. Ensure permissions allow service_role and backend access
ALTER TABLE "admins" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE "admins" TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Update master administrator credentials & reset 2FA cleanly
-- Master Password: CyberKovai@2026
-- Email / Username: Kovaicyber@gmail.com
UPDATE "admins"
SET "password_hash" = '$2b$10$GGFkQx9zgihEmLCXOc7csOLooDbLvpbQj96mcGw3AkTGUP7wvFrNC',
    "two_fa_enabled" = 0,
    "two_fa_secret" = NULL,
    "backup_codes" = NULL,
    "updated_at" = NOW()
WHERE LOWER("username") = 'kovaicyber@gmail.com' OR LOWER("email") = 'kovaicyber@gmail.com';

-- 4. Verify the updated admin record
SELECT id, username, email, role, two_fa_enabled, two_fa_secret, updated_at
FROM "admins"
WHERE LOWER("username") = 'kovaicyber@gmail.com';

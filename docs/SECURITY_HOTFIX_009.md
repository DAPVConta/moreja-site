# Migration 009 — Security Hotfix

Fixes three critical issues identified in the security audit. **Run this migration immediately on production.**

## What it changes

1. **`is_admin()` no longer reads `user_metadata`.**
   `user_metadata` is editable by any authenticated user (`supabase.auth.updateUser({ data: { role: 'admin' }})`). Any signed-up user could promote themselves to admin and bypass RLS on every CMS table.
   New behavior: `is_admin()` queries the new `admin_users` table, which is writable only by `service_role`.

2. **`leads` table no longer accepts public `INSERT`.**
   The `public_insert_leads` policy with `WITH CHECK (true)` was dropped. The `send-lead` edge function (which uses `service_role`) is now the only legitimate write path. New `service_role_write_leads` policy permits this.

3. **Basic input-size CHECK constraints on `leads`.**
   `name`/`email`/`phone`/`message` length limits + email-format regex. Defence in depth.

## Deploying

```bash
# Local (or any env where you have SUPABASE_DB_PASSWORD in .env.local)
node scripts/run-migrations.mjs

# Or paste supabase/migrations/009_admin_users_and_security_hotfix.sql
# directly into the Supabase SQL editor
```

The migration auto-migrates any existing user with `user_metadata.role = 'admin'` (or `app_metadata.role = 'admin'`) into `admin_users` as `'owner'`.

## If your admin is locked out after migration

If the existing admin user did **not** have `user_metadata.role = 'admin'` set in `auth.users`, the seed step will not have migrated them and `is_admin()` will return false.

Add them manually via the Supabase SQL editor (using the **service_role**, e.g. directly in the Studio SQL tab):

```sql
INSERT INTO admin_users (user_id, role)
SELECT id, 'owner' FROM auth.users WHERE email = 'YOUR_ADMIN_EMAIL@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
```

## Disable public sign-up

Independently of this migration, **disable email sign-up** on the Supabase project:

> Authentication → Providers → Email → toggle "Enable email signup" off

Otherwise anyone can create an account (it just won't be an admin anymore).

## Roles available

- `owner`   — full access + can manage other admin_users
- `admin`   — full CMS write access
- `editor`  — full CMS write access (functionally identical to `admin` for now; reserved for future per-table granularity)
- `viewer`  — read-only (reserved; future SELECT policies will use `admin_role()`)

`is_admin()` returns `true` for `owner`, `admin`, `editor`.

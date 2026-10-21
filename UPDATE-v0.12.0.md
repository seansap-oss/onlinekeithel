# OnlineKeithel v0.12.0 — approved Option 1 build

This is an update to the existing OnlineKeithel source folder. It is not pushed to GitHub or deployed; this checkout's Git origin is still the older `emarket` repository, so do not push from it until the `onlinekeithel` remote is confirmed.

## Install on Windows / VS Code

Download `OnlineKeithel-v0.12.0-source.zip` to Downloads. In VS Code, open the existing OnlineKeithel folder containing `package.json`, open Terminal → New Terminal, stop any running server with `Ctrl+C`, then run:

```powershell
if (!(Test-Path '.\package.json')) { throw 'Open the existing OnlineKeithel project folder first.' }
$releaseFolder = Join-Path $env:TEMP ('OnlineKeithel-v0.12.0-' + [guid]::NewGuid())
Expand-Archive -Path "$env:USERPROFILE\Downloads\OnlineKeithel-v0.12.0-source.zip" -DestinationPath $releaseFolder -ErrorAction Stop
Copy-Item -Path "$releaseFolder\*" -Destination . -Recurse -Force -ErrorAction Stop
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Read the error above.' }
npm.cmd run review
```

Open `http://127.0.0.1:5189/` in Chrome. This is a local review mode with fictional fixtures for layout only; they are not real sellers, contacts, or paid placements. The production build does not show those disconnected fixtures. `.git` and `.env.local` are excluded from the ZIP and remain in your existing project folder.

## What is ready in the UI

- `/login`: email/password login and signup, reset link, plus phone OTP. Phone numbers default to India when entered as 10 digits; international numbers need a `+` country code.
- `/sell`: sign in, create an Individual or Shop profile, choose a category/theme, then upload listing photos and details.
- `/shop/your-shop-name`: shareable storefront with its own identity and inventory.
- `/dashboard`: seller profile, listings, options/stock, social/video links and package controls.
- `/admin`: protected admin sign-in and the existing listing/category/user controls, homepage editor and ticker editor. The footer gesture can reveal the admin login, but cannot grant access.

These screens are implemented; they cannot save or authenticate until the dedicated backend is connected. Admin rights are not created by a hidden feature or a password in source code.

## When to connect Supabase

Connect it after the local UI build is installed, and before testing any real account, shop, listing, upload or admin save. Create a dedicated Supabase project for OnlineKeithel only—never use the unrelated IAS project.

For an existing OnlineKeithel database already through migration 009, apply `database/migrations/010_discovery_categories.sql` once in the Supabase SQL editor. The equivalent Supabase CLI migration is `supabase/migrations/20261020180000_discovery_categories.sql`; use one migration workflow, not both. For a new empty project, run `database/schema.sql`, `database/storage.sql`, then migration 010.

In Supabase, enable email/password and set the allowed redirect URLs for your local review address and the one production domain. Add the project URL and public publishable key to the existing `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then restart the local server. Those two values are public client config; never paste a service-role key into chat or commit it.

Phone OTP also needs Phone authentication enabled and an SMS provider configured in Supabase. Supported hosted-project providers currently include Twilio, MessageBird and Vonage; Supabase's guide notes TextLocal as community-supported. Without provider credentials, the phone form will return a provider error rather than sending an SMS. See [Supabase Phone Sign-in](https://supabase.com/docs/guides/auth/phone-login).

Create your first account, copy its real user UUID from Supabase Auth → Users, then grant admin membership in the SQL editor:

```sql
insert into public.admins(user_id) values ('PASTE_YOUR_ACTUAL_USER_UUID');
```

Then sign in normally and open `/admin`. The administrator membership must be granted from the trusted SQL editor; do not expose an admin password or service key.

Only after local auth, two-account seller ownership, storage/RLS and admin actions pass should these environment variables be added to the single existing Vercel OnlineKeithel project. Server-only keys belong in Vercel settings, never in a browser-visible `VITE_` variable. This release has not been published and no live auth/SMS acceptance has been performed.

# OnlineKeithel v0.11.0 — category destinations

This complete source release includes the existing website and the approved category expansion. It is not a live deployment.

## Windows update

Download OnlineKeithel-v0.11.0-source.zip to Downloads. Open the existing project folder containing package.json in VS Code. Stop its running server with Ctrl+C. Run in PowerShell:

```powershell
if (!(Test-Path '.\package.json')) { throw 'Open your existing OnlineKeithel project folder first.' }
$releaseFolder = Join-Path $env:TEMP ('OnlineKeithel-v0.11.0-' + [guid]::NewGuid())
Expand-Archive "$env:USERPROFILE\Downloads\OnlineKeithel-v0.11.0-source.zip" $releaseFolder -ErrorAction Stop
Copy-Item "$releaseFolder\emarket\*" '.' -Recurse -Force -ErrorAction Stop
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Read the error above.' }
npm.cmd run review
```

The package contains no .env.local, node_modules or .git folder. Your existing credentials and Git history remain in the project. The emarket inner folder is retained for compatibility; the site is branded OnlineKeithel.

Open http://127.0.0.1:5189/. Check v0.11.0 in the footer.

- /homes: property for sale/rent, land, commercial space, PG and holiday accommodation.
- /jobs: employment filters and occupation subcategories.
- /motors: cars/commercial, motorcycles/scooters, bicycles.
- /whats-on: events, free entry, food markets, restaurant offers and community activities.
- /recruiters: employers drawn from the latest 100 published vacancies.
- /recruiter/your-profile-slug: shareable employer page and up to 100 recently published jobs. Uses the name, description and location set in your seller profile.
- /sell?category=jobs (or property / happenings): sign in, create your profile if needed, then add the relevant listing. Normal login is required even in review mode.
- /preview/seller?category=jobs: development-only posting interface review. Changes cannot save.
- /preview/admin: development-only admin review. Changes cannot save.

Use the sidebar category selection to inspect all relevant posting fields. Jobs store starting salary as price (0 if undisclosed), with salary basis; event price is the entry amount (0 for free). Property price has its own period/basis. Event times are India time. No new fake jobs or events have been published. Those sections show an honest empty state until listings are added.

## Database setup

For an existing dedicated OnlineKeithel database already updated through v0.10, run database/migrations/009_departments.sql once in its SQL editor. Alternatively use the matching supabase/migrations/20261010195000_departments.sql with your migration workflow; do not run both workflows. It preserves existing ads, custom children and category visibility, adds missing children, and updates the approved category names/fields.

For a NEW empty dedicated OnlineKeithel database only, use the full database/schema.sql and database/storage.sql instead. Do not rerun the fresh schema against an existing database. Never apply this to the separate IAS database.

Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY locally/in Vercel, configure auth and storage, and create real administrator membership. Restart/redeploy after environment changes. Without that setup, no real account creation, upload or database publication has been verified.

## Promote an event on the ticker

Publish its event listing, copy its /listing/... link, then open the real /admin → Ticker editor. Add a message with the event title, emoji and link, set its start/end schedule and Sponsored label if paid, then Save & publish. Ticker approval/billing is manual; an event does not automatically purchase or receive ticker space. This uses the existing protected publishing function and requires the admin publishing migration already supplied in v0.9.

## Verification and remaining scope

Production build and 26 automated tests pass. New migration replay/preservation and event/job validation are tested. Server rendering passes for the five entry routes. Remote browser could not connect to the local server; visual interaction, real Supabase save/upload and production acceptance still need testing.

Homes, Jobs and What's On currently use category artwork in the hero; Motors uses the bundled car photograph. No verification badges are fabricated. External application/booking/WhatsApp actions are handoffs, not completed applications, reservations or purchases. Recruiters edit their identity through the shared seller profile; a separate applicant-tracking dashboard is not included. Department-specific hero editing, automated ticker payments, ticket booking and hotel availability calendars remain future work.

GitHub/Vercel deployment is still blocked by the previously reported connection/access setup. No deployment is claimed by this ZIP.

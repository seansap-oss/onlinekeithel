# OnlineKeithel v0.10.0

This is a full-source update. Keep your existing project folder, `.git` and `.env.local`; replace the source with the contents of the ZIP's `emarket` folder. Stop the old dev server first.

## Windows installation

From PowerShell in your existing OnlineKeithel project:

```powershell
if (!(Test-Path '.\package.json')) { throw 'Open your OnlineKeithel project folder first.' }
$updateFolder = Join-Path $env:TEMP 'OnlineKeithel-v0.10.0'
Expand-Archive "$env:USERPROFILE\Downloads\OnlineKeithel-v0.10.0-source.zip" $updateFolder -Force -ErrorAction Stop
Copy-Item "$updateFolder\emarket\*" '.' -Recurse -Force -ErrorAction Stop
npm.cmd ci
if ($LASTEXITCODE -eq 0) { npm.cmd run review }
```

Open **http://127.0.0.1:5189/** in Chrome or Edge. Port 5189 avoids the older localhost cache collision with your other website. Check **v0.10.0** in the footer.

For the ticker editor without connecting a backend yet, open **http://127.0.0.1:5189/preview/admin** and choose **Ticker editor**. You can experiment with the controls; this development review route cannot save or publish. `npm run dev` starts normal development without enabling these review routes. Review routes are disabled in production builds.

## Approved public UI

- Removed the announcement above the header and the large always-open search box.
- Compact circular search opens a panel with product/shop/category results; saved heart sits before account.
- Header ticker scrolls continuously, with pause, hover/focus pause and reduced-motion support.
- Hero rotates after five seconds through the welcome image, editable official slides and eligible paid campaigns. It pauses for hover, keyboard focus, hidden browser tabs, playing video dialogs and reduced-motion preferences. Video playback requires a click.
- Categories appear under the hero with a See all categories link and a swipeable full department rail. Construction remains one department, containing architects and trades. Category choices from the rail are remembered on this device to prioritize future visits.
- Light/dark choice persists on the device. Desktop has a theme button; mobile has the switch in the hamburger menu.
- Existing product/shop sections and seller features remain.
- Footer now reads **Created by Avit Solutions** and links to **https://www.avitsolutions.tech/**. Original roof logo preserved.

## Ticker editing

1. Sign in with your admin account and open **/admin → Ticker editor**.
2. Add a message or choose an existing one. You can move it earlier/later, hide it or remove it.
3. Type the text. Highlight any letters or words and apply colour, font, size, bold, italic or underline. With no selection, formatting applies to the whole message. The formatted preview shows the result.
4. Insert trophy, fire, sale, party and other emojis using the palette, or paste any Unicode emoji. On Windows, use **Windows + .** to open the emoji picker. Leading icons and separators are independent.
5. Add a local product/shop link or HTTPS destination. Each message can link separately.
6. Choose the tape background and scroll speed. Preview both the whole design and the messages currently eligible for display.
7. Optionally set start and end dates in your local timezone. Blank dates mean immediately/ongoing. Disabled, expired and empty messages do not run publicly.
8. Mark a paid placement as **Sponsored** after arranging payment. This editor does not charge customers, verify payments or measure ad views; billing is manual for now.
9. **Save draft** stores unpublished edits. **Save & publish** updates the public settings. Visitors already on a page should refresh to load newly published settings; schedules on an already loaded ticker are checked each second. Previous versions can be restored into the editor, reviewed and republished.

Undo/redo covers recent edits in the current editor session. Text is stored as structured formatting, not executable HTML. Fonts are five safe presets and sizes range from 12 to 36 pixels. Hero and ticker share one website-content draft and published history; save before switching editor tabs. The app warns before discarding unsaved edits.

## Hero management

Use **Admin → Homepage → Rotating hero slides** to add/remove/reorder slides, edit titles/descriptions/buttons, upload an image, paste an embedded video URL or upload an MP4/WebM up to 6 MB. Approved paid campaigns continue through the existing Advertisements controls. Longer videos can use hosted links. Provider embed restrictions may still require opening the original service.

## Backend and publishing requirements

No new database migration is required beyond the v0.9.0 admin publishing update: `supabase/migrations/20261009051356_admin_publishing.sql`. Existing installations must already have it and prior migrations applied. New installations use `database/schema.sql` plus `database/storage.sql` on a **dedicated marketplace project**.

Real account creation, file uploads, saved drafts and publishing still require configured Supabase credentials, storage policies, admin membership and email delivery. The ticker and hero reuse the protected website settings/draft/revision model. There is no built-in admin password and no account impersonation in the review route.

This ZIP is not a Vercel deployment. GitHub write access was blocked in the previous attempt; no successful new upload/deployment is claimed here. Install and review locally first, then commit and push from your authenticated Git checkout when ready.

## Verification

- 24 automated tests pass, including character formatting, style preservation after edits, emoji insertion, schedule filtering, unsafe link/style handling, database permissions, publishing concurrency and persistence of formatted ticker settings.
- Production build and Sites packaging checks pass. The existing main bundle still produces Vite's size advisory.
- Server-side rendering checks pass for the public homepage and ticker editor.
- The environment's cloud browser could not connect to the local preview server. Actual mobile/desktop visual inspection and live Supabase upload/save/publish acceptance remain outstanding. The code is packaged for your local review; this is not a claim of launch readiness.

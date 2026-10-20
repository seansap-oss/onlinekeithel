# OnlineKeithel v0.9.0 — Windows update

## Install the source in VS Code

1. Stop your current local server with **Ctrl+C** in the VS Code terminal.
2. Make a backup of your current project folder, including your local environment file.
3. Extract `OnlineKeithel-v0.9.0-source.zip`. Open the extracted **emarket** folder (the one containing `package.json`) in VS Code.
4. Copy your existing `.env.local` into that folder if you already configured the dedicated marketplace backend. Do not copy `node_modules`.
5. Select **Terminal → New Terminal** and run:

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

Open the Local URL printed by Vite. The footer should show **OnlineKeithel · v0.9.0**. If an old installed PWA keeps the old name, close it and reload the website; reinstall the shortcut if needed.

## What changed

- Exact OnlineKeithel spelling in public copy, titles, installed-app metadata and checkout text.
- Locally bundled Caveat handwritten wordmark in dark green. The approved horned roof artwork is preserved.
- Existing header order, search, saved heart and yellow **+ Post ad** button preserved.
- Footer copyright hold opens administrator sign-in after five seconds, with no public instruction. Keyboard users can hold Enter or Space. Releasing early or moving away cancels it.
- Footer credit: **Created by Ebit Solutions**, with restrained green and red accents.
- Public sample/demo banners and labels removed. Unactivated catalogue products cannot accept payments or messages.
- Admin homepage draft storage, live hero preview, publish, stale-edit protection and previous-version restoration.
- Category/subcategory controls for icons, colours and ordering; new categories remain data-driven. Construction continues to group architects, builders and trades.
- Admin listing/category/advert deletion, user directory and email invitations, and editable starter-product import.

## Enable the new admin features

For an existing dedicated OnlineKeithel Supabase database that already has updates 004–007, run:

`supabase/migrations/20261009051356_admin_publishing.sql`

For a new dedicated database, use `database/schema.sql` and `database/storage.sql`; the fresh schema already includes the update. Never apply the fresh schema over an existing database. Never use an unrelated application’s database.

Keep frontend values in `.env.local` / Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

User invitations require the Vercel server variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The service key must never have a `VITE_` prefix. Configure the Supabase Site URL, email delivery and redirect allowlist for your actual deployment. Admin users must exist in `public.admins`; use your own verified account, not a shared password.

The five-second gesture only opens sign-in. It does not grant admin access. There is no built-in administrator password in this archive.

## Owner workflow

- **Homepage:** edit → preview → Save draft → Save & publish. Previous versions restore into the editor first.
- **Categories:** Add new → name/stable ID → theme/icon/colour → add subcategories → save. Keep IDs stable when renaming. Categories or subcategories referenced by products cannot be deleted until those products are reassigned. Use Active to hide a category instead.
- **Listings:** edit prices/photos/options; remove from public view or permanently delete with confirmation.
- **Starter catalogue:** choose an existing seller and template → import drafts → review each product’s photos, details and price → publish from Listings. Re-importing preserves existing records by SKU. Published counts obey the seller’s package.
- **Users:** review accounts and send an invitation. Sellers can be suspended/restored in Sellers. Account deletion and role assignment are intentionally not exposed here.

Until the marketplace backend is connected, the bundled browsing catalogue remains read-only. Once connected, database content takes precedence. The importer creates editable records; it does not create fictional authenticated seller accounts. Existing illustrative assets should be replaced with accurate seller photos before products are offered for sale.

For local visual review only, set `VITE_PREVIEW_MODE=true` and restart Vite. Open `/preview/admin` or `/preview/seller`. These routes cannot save and are disabled in production. Standard Vite does not serve Vercel `/api` handlers; user invitations and package checkout require Vercel (or a configured Vercel local runtime).

## GitHub and Vercel

This archive contains no secrets, no Git history and no installed dependencies. Copy its contents into your existing Git checkout while preserving your `.git` and `.env.local` files. Review and commit from the VS Code Source Control panel, then push to `seansap-oss/emarket`.

If Vercel is connected to the pushed branch, it should create a deployment automatically. Confirm that deployment succeeds and that its footer reads v0.9.0. The database update is separate from deployment.

This release was not uploaded from the assistant workspace: GitHub's integration denied repository writes (403). No new Vercel deployment is claimed.

## Verification

21 automated tests passed, including database authorization, private drafts, atomic publication, stale editor rejection, quotas, product validation and payment signatures. Production build and Sites packaging checks passed. Cloud browser access to the local server failed, so the new appearance, footer hold and real backend email/upload flows still need acceptance testing in your local browser/configured deployment.

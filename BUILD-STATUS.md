# Build status — v0.15.0 Free Launch RC1

Free-launch build: paid-package marketing and seller upgrade links removed from the public UI; checkout creation is disabled by default; sellers see their free allowance. The dedicated OnlineKeithel Supabase project now has a 100-active-ad free allowance and no 14-day public listing expiry. Older paid package and entitlement records were preserved, with paid plans inactive. A local SQL test verifies that an old published listing remains visible, 100 posts succeed, and the 101st is rejected. Android Studio test source has been added using Capacitor. Email/password auth, upload and WhatsApp enquiry still need a two-account live acceptance test; production SMTP is not configured or verified in this build. No WhatsApp OTP is configured. This is a release candidate, not a declaration that public registration is ready.

Apply `015_free_launch.sql` after earlier migrations on any other Supabase installation. The dedicated project was updated during this build. Verification: 35 app tests, 4 Sites tests, production build and Capacitor Android sync passed; no SDK-backed APK build was run. GitHub terminal push was blocked by missing credentials and the GitHub integration returned 403 for writes. The existing Vercel project `onlinekeithel` is a CLI deployment with `onlinekeithel.vercel.app`; it is not listed among the connected Git projects, so a Git push alone cannot be assumed to publish it. A complete release ZIP with a Git bundle is provided for the user's existing Windows folder. No new GitHub or Vercel deployment has been claimed.

## Earlier v0.14.4 note

The user's screenshot exposed a live database function that rejected one-photo fashion listings. Applied `listing_packages_v0144` and `unlimited_listing_gallery_v0144` to the dedicated OnlineKeithel Supabase project `plllhsjsruhasdvbzhpw`. Read-only checks confirmed the four-angle rule is gone, photo count is unrestricted, the existing draft is still present, and active package prices/limits/durations match the new tiers. No real signed-in listing save or payment was made here. The photo helper now recommends optional additional angles without mentioning compression. The free package permits two active ads for 14 days; Quick Seller 5/₹100/14 days; Individual 10/₹200/30 days; Premium Business 20/₹400/30 days; Business Plus 50/₹600/30 days. Connected payment acceptance remains pending Razorpay configuration. Verification: 33 app tests, 4 hosting tests and the production build pass. The source migrations are included for repeatable installs, and the Windows source ZIP must still be installed locally to display the updated UI.

## Earlier v0.14.3 note

The approved simplified seller form is implemented: photos first, essential listing fields visible, optional details in accordions, public posting as the primary action, a draft alternative, and duplication from an existing listing. Clothing accepts one photo; gallery storage validates up to 50 entries. Phone photos are resized and compressed to JPEG under 4 MB before upload. Size choices without stock variants carry into the WhatsApp enquiry and ask the buyer to confirm availability. The listing form accepts hosted video/social URLs, not direct video uploads.

The light canvas is white again. Dark mode uses charcoal/gray content surfaces with readable light text while keeping the existing white header/footer and green ticker. The local browser rendered the homepage and seller editor, and exposed a missing dashboard icon import that was fixed. Verification: 33 automated tests, 4 Sites tests and the production build pass. Vite still reports a main-bundle size advisory. Connected account posting and storage have not been verified here. Apply migration 012 on an existing Supabase database before relying on one-photo clothing posts or galleries above the old limit. No GitHub or Vercel deployment was made in this build.

## Earlier v0.14.2 note

The seller screenshot showed “kurta” in Draft with 0/3 active listings. The homepage query selects only `published` records and orders them by `created_at` descending. No live product or database status was changed remotely. The prior gray wash in light mode was reverted in v0.14.3. Initial mode is light even on devices that prefer dark or had a previous local theme setting. Connected Supabase acceptance for the user's account has not been exercised from this workspace.

# Build status — v0.14.1

Fixed a homepage crash reported from the Windows local preview. The browser console identified `ReferenceError: shuffle is not defined` in `Home`. Removed the stale calls so review fixtures display and live listings retain their newest-first query order. No database change beyond the already included v0.14 migration.

# Build status — v0.12.0

## v0.12.0 — Option 1 marketplace home, auth UI and category gaps (20 October 2026)

Implemented the approved Marketplace Focus landing page: split handloom hero, paired Explore/Post ad actions, dark forest-green ticker with white text, swipeable pastel category row in the Option 1 order, optional paid-campaign cards before a shuffled fresh-listing feed, and improved empty-state wording. Legacy default ticker values are upgraded to the new contrast treatment without overwriting custom ticker content. The home carousel still rotates every five seconds and pauses for interaction/reduced motion.

Added the Supabase SMS OTP interface beside email/password sign-in and reset, with India-number normalization and E.164 support. Added Free & Wanted, Boats & Watercraft and Musical Instruments roots, plus wanted/free/swap, antiques, business-for-sale, tickets and community-notice children. Boats route into Motors. Fixtures are now only rendered in local review/development; production does not show disconnected invented listings by default.

The seller dashboard, `/shop/:slug` storefront editor and protected `/admin` (including categories, ticker, homepage, listings and user controls) already exist in the source and were retained. They are not live-acceptance tested: this checkout has no dedicated OnlineKeithel Supabase credentials. Email confirmation, phone SMS delivery, uploads, saving, admin actions, campaign purchases and publishing stay blocked until a dedicated project is connected. Phone OTP additionally requires enabling Supabase phone auth and configuring an SMS provider. Apply `database/migrations/010_discovery_categories.sql` (or its timestamped Supabase equivalent) after the existing v0.11 category migration; for a new project, run `database/schema.sql`, `database/storage.sql`, then migration 010.

Verification: 29 automated tests pass; `npm run build` passes. Vite reports the existing 782 KB main bundle advisory, and its deferred admin starter-catalogue chunk remains in the build. Local visual QA is blocked: the development server starts on loopback, but the Work Mode browser cannot reach `terminal.local:4173` (`ERR_CONNECTION_REFUSED`), and binding to `0.0.0.0` fails in this runtime. `design-qa.md` records the block; no visual pass or backend readiness is claimed. This release has not been pushed to GitHub or deployed to Vercel.

## v0.11.0 category destinations (11 October 2026)

Added /homes, /jobs, /motors, /whats-on, /recruiters and /recruiter/:slug. Expanded additive taxonomy and CSV reference. Search supports exact JSON attribute filters; posting includes relevant property/job/event fields, validation, enquiry-only commerce and safe external application/booking links. Recruiters reuse seller profiles and published jobs (directory shows recruiters from the latest 100 vacancies). New departments render live/fixture data without invented new vacancies or events. Events can be promoted manually using the existing admin ticker editor with their listing link. No automatic ticker purchase or promotion workflow.

Production build and 26 tests pass. Server rendering checks pass for all five new entry routes. Cloud browser cannot connect to localhost (ERR_CONNECTION_REFUSED); interactive visual verification remains pending. No configured marketplace Supabase project, no new GitHub push or Vercel deployment. Existing backend must apply database/migrations/009_departments.sql (same as timestamped Supabase migration). Fresh installations use current database/schema.sql and database/storage.sql.

Hero illustration panels are used on Homes, Jobs and What’s On; Motors uses the bundled vehicle photo. Existing account/profile images remain configurable; per-department hero editing is not yet part of the homepage admin editor. Native apps, bookings, ticketing, applicant tracking and product payment settlement are not implemented.

## v0.10.0 approved interface and rich ticker (10 October 2026)

Implemented compact search panel, header saved heart, removed announcement, ticker under header, five-second hero rotation with editable slides/video uploads, category rail, persistent device-level light/dark theme, and corrected Avit Solutions footer link. Dedicated ticker editor supports selected-letter formatting, fonts/sizes/colours, arbitrary emoji insertion, icons/separators, links, schedules, sponsored labels, ordering, visibility, undo/redo and shared website draft/publish/history. Paid ticker billing remains manual. No new migration beyond v0.9 is required.

24 automated tests and production build pass; server-render checks cover homepage and ticker editor. Historical migration-006 test now correctly expects that migration's original spelling; the full current schema/publishing test verifies OnlineKeithel and persists formatted ticker JSON. Browser preview connection was refused, so visual interaction and live provider acceptance remain unverified. No new GitHub/Vercel deployment is claimed. See `UPDATE-v0.10.0.md`. Supabase provisioning and production email/storage/admin setup remain pending.

## v0.9.0 brand and owner controls (9 October 2026)

Corrected OnlineKeithel throughout public content; bundled the Caveat wordmark font; preserved the roof logo and header layout; changed the posting CTA; added five-second footer admin sign-in and Ebit Solutions credit. Added server-protected user listing/invitations, category icon/colour/subcategory editing, deletion controls, editable starter catalogue import, and database-backed homepage draft/publish/revision recovery with optimistic concurrency checks. Migration `supabase/migrations/20261009051356_admin_publishing.sql` is required on an existing database. Fresh schema includes it. Existing 004–007 history is retained.

21 automated tests passed. Production and Sites packaging builds pass. Browser preview failed with connection refusal in this environment; new visual interactions have not been visually verified. No dedicated backend is configured, so real account writes, invitations, uploads and publishing remain provider-dependent and unverified. GitHub denied create-tree writes with 403. No Vercel deployment is claimed. Read `UPDATE-v0.9.0.md` for installation and limitations. Bundled disconnected catalogue records are read-only; the importer creates editable database drafts once genuine seller accounts exist.

## v0.8.0 shareable storefronts (4 October 2026)

Added `/shop/:slug` for every seller and individual, with old `/seller/:slug` URLs redirected in the browser. Shop identity editing now includes a cover-led hero, headline, tagline, welcome message, preset accent/font, featured social video, six-photo gallery, optional section visibility and ordering. Sample shops demonstrate custom presentation; the dashboard previews changes and copies the share link. The existing backend seller ownership rules also cover the new JSON settings. Migration 007 is required on a connected existing marketplace database; fresh schema includes the column. Eight test files and the production build pass; browser inspection covered the public shop, legacy route and preview seller editor. Real seller writes and live service acceptance remain unverified because no marketplace backend is configured here. This version is local and is not on GitHub or Vercel yet.

## v0.7.0 brand and construction department

Onlinekeithel replaces the marketplace-facing Leikai Market brand in the header, title, manifest, app icons, payment descriptor and assistance copy. The selected architectural roof logo has a scalable SVG and rendered PWA icons. The Construction header and drawer expose a single department with nested specialists; search and category directory group the same existing IDs. Builder, bricklayer, handyman, labourer and supervisor options appear inside the construction trades category. Existing category IDs and listing references remain stable. An optional 006 SQL migration updates an old marketplace name and adds these subcategories to a connected backend; it must be applied to the dedicated marketplace database before those new choices are used by live sellers.

## v0.6.1 seller UI handoff (4 October 2026)

The seller dashboard, photo upload drawer, clothing variant/stock editor, vehicle details, shop identity, UPI/social settings and buyer listing were visually inspected in a local browser. An HTTP preview incompatibility with `crypto.randomUUID()` in the size editor was corrected with a secure-random-byte fallback. All seven test files and the production build pass. This is a complete-source release archive reconciled on top of the current GitHub main. No live seller save or payment was claimed: backend credentials and migration are still required. GitHub write API returned 403; shell Git fetched main but lacked credentials for push. No new deployment was made from this workspace.

## Implemented

Marketplace UI, product/shop discovery, product detail and WhatsApp composer; seller identity/themes and listing forms; collections; package comparison and Vercel payment handlers; scheduled advertising with admin approval; admin content/catalogue controls; reports and audit log; CSV import; PWA offline fallback; Supabase schema, RLS and storage policies.

## Verified locally

- Production Vite build succeeds; development catalogue is excluded from production JavaScript.
- PGlite executes the actual schema and tests: cross-seller write denial; free-plan limit; seller suspension protection; entitlement self-upgrade rejection; campaign approval/payment protection; anonymous visibility; changed creative returns to pending; duplicate payment fulfilment is idempotent; package expiry reduces public visibility while owner retains records; suspended seller products disappear.
- Domain tests: WhatsApp number validation/URL encoding; dangerous/social lookalike URL rejection; video URL parsing; search text includes entered social URLs/attributes; CSV invalid categories/prices/SKUs/images; payment signature tampering rejection.
- Browser desktop: home, keyword search, product detail, enquiry composer, seller editor, category field switching and social-link inputs.
- Additional visual/responsive evidence and final browser results are recorded in `design-qa.md`.

## External services still required

- A new dedicated Supabase project. The only connected project is an unrelated IAS application and was not changed.
- Email sender and redirect URL configuration; real signup/confirmation/login/recovery/upload acceptance.
- Administrator account UUID, selected by the owner. No password is hardcoded and no admin account has been secretly created.
- Razorpay account keys and webhook configuration. No live or test-mode payment was made; payment-provider end-to-end acceptance remains blocked.
- Vercel project linked to this repository with environment variables. The available Vercel deployment action returned tool-not-found; no direct Vercel deployment has been claimed.

## Scope still open / not implemented

- Phone OTP: email/password implemented instead; SMS provider not selected.
- Native Android/iOS binaries; native distribution remains a later phase as requested.
- Live Instagram/Facebook embed acceptance with seller-provided public URLs.
- Server-rendered listing SEO and rich per-product social previews.
- Durable background imports, remote image ingestion, automatic social caption/feed import, and complete 15,000-row load verification.
- Multiple collection memberships, collection reordering, catalogue export/rollback, and shop staff accounts. Product variants are implemented in v0.6.0; stock reservation and product order fulfilment are not.
- Advertisement impression/click analytics, automated advertising checkout and inventory booking.
- Admin MFA, total-storage quotas, upload cleanup, account deletion UI, automated reconciliation, operational monitoring and backup restore drill.
- Final public business identity, contact details, prices, refund policy and legal copy. Current terms/privacy copy is a launch checklist, not completed legal advice.

## Production acceptance before public launch

1. Sign up two real test users; verify email, login, reset, session persistence and sign-out.
2. Create individual/shop profiles, upload images, publish/edit/sell products, and verify global search/social URL search from a separate browser.
3. Attempt cross-account API reads/writes and uploads against the live service; run Supabase security advisors.
4. Purchase a package in payment test mode; replay webhook; test failed/cancelled/captured payment and expiry.
5. Submit a campaign; approve and record payment; verify schedule, rejection and later creative edits.
6. Verify WhatsApp deep links on Android, iPhone and desktop without sending test messages to unrelated people.
7. Test PWA installation/offline behaviour, mobile keyboard, pinch zoom and actual iOS/Android social players.
8. Configure support/privacy/refund information, monitoring, backups and media budgets before opening paid registration.

## Latest continuation

- Fixed admin moderation action placement inside the editing dialog.
- Converted payment webhook to a Web Request handler, preserving signed bytes and returning retryable errors for temporary fulfilment failures. Added checks for missing configuration, byte-level signature tampering and oversize requests.
- Excluded offline HTML and both install icons from the SPA rewrite.
- All four test files pass; production build succeeds. The main JavaScript chunk still exceeds Vite's advisory size threshold.
- GitHub upload attempted: connector returned HTTP 403 `Resource not accessible by integration`. Git CLI has no authenticated credential. Source is committed locally, but NOT uploaded to GitHub.
- Vercel project listing still contains only the unrelated IAS projects. No marketplace deployment exists in the connected team.
- A downloadable source archive is provided pending GitHub write access. No secrets or node_modules are included.

## v0.4.0 — supersedes earlier development-only catalogue statements

Public placeholders now ship in production by explicit user request. Five sample stores, ten collections and seventeen products are included. /templates offers category previews. Seller category selection applies a template, including the new motorcycle theme. Samples stop when VITE_SHOW_SAMPLES=false or a real Supabase backend is configured. Protected preview routes remain development-only.

The user's v0.3.0 repository commit has three successful Vercel deployments (emarket, emarket-adx4, emarket-dou6). Connector project listing is incomplete/stale; GitHub commit status confirms deployment. The v0.4.0 update cannot be pushed by this connection: GitHub still returns 403 for write operations. See SHOWCASE-UPDATE.md for applying the archive to the existing Windows folder and pushing to trigger redeployment.

## v0.5.0 — comprehensive categories

Implemented 31 parent categories and 331 subcategories with icons, searchable /categories directory, dependent seller/search selectors, CSV import mapping/reference, admin editing and database migration 005. Existing IDs and legacy listings without children are retained. Research and full catalogue: docs/CATEGORY-GUIDE.md. All six test files passed; production build passed (existing large-chunk advisory remains). Browser review verified directory rendering and Pallet racks navigation. Remote push remains blocked by GitHub integration HTTP 403, so this release is packaged as a cumulative update from v0.3.0. This version has not been deployed live.

## v0.6.0 — seller product tools

Implemented 12-photo galleries with URL input, removal and reordering; four-photo clothing publication requirement; mouse/pen hover rear view; mobile thumbnails; six videos/embedded posts, including short MP4/WebM uploads up to 6 MB; expanded vehicle specification fields; retail/enquiry modes; XS–XXL and custom variants with per-option stock/prices; quantity/subtotal/availability checks; seller UPI ID/QR and cash preferences; WhatsApp purchase-request summaries; mixed-shop title/category filters; extended CSV import options. Mixed-store batteries and sold-out toys plus four-angle garment illustrations are clearly labelled samples.

Seven test files pass, including real local SQL validation and existing RLS/quota/payment tests. Browser checks verify hover, mobile gallery/width, variant/quantity/subtotal, sample contact protection, mixed-shop filtering and out-of-stock controls. Actual uploads, live account persistence, direct UPI payments and seller-package checkout still require configured services and device testing. There is no confirmed product-order/cart system, automatic stock deduction/reservation or Razorpay product checkout in this version.

Local code is packaged for GitHub/Vercel. No remote database or production deployment was changed; connector write permission remains blocked. Apply the product-options migration before deploying against an existing backend.

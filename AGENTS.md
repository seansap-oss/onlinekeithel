# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Marketplace decisions — 3 October 2026

- GitHub destination: seansap-oss/emarket. Hosting target: Vercel.
- Use the first approved design: forest green, warm saffron, white/cream, local handloom imagery.
- Messages are WhatsApp handoffs only. Never create chat history or imply that clicking the website sent a message.
- Marketplace layout stays consistent; sellers choose general/fashion/electronics/vehicles storefront themes.
- Header hamburger precedes logo. Compact bottom navigation is based on viewport width. Preserve pinch zoom.
- Never simulate a logged-in user or paid entitlement in production. Visual fixtures are dev-only.
- Use a separate Supabase project, never the existing IAS database. Provisioning awaits organisation selection.
- Admin is a verified auth account listed in the private admin membership table; no shared password.
- Update BUILD-STATUS.md honestly after verification and deployment. Do not call provider-dependent flows verified until exercised against configured services.

## Public showcase decision — v0.4.0

User explicitly requests placeholder shops/products on the live Vercel site, matching localhost. Public samples are now allowed and clearly labelled; sample records have no contact numbers and no purchase functionality. VITE_SHOW_SAMPLES=false removes samples on rebuild. A configured Supabase backend takes precedence. Admin/seller visual review routes remain development-only. Add a motorcycle storefront and automatic template selection by shop category.

## Category expansion — v0.5.0

Maintain one shared catalogue for navigation, seller forms, search and imports. Include construction materials, architects/designers, contractors, warehouse supplies, tools, electrical, plumbing, finishes, machinery and safety. Preserve stable existing category IDs. Subcategories belong to one parent. Use labelled Phosphor icons.

## Product tools — v0.6.0

Support independent listing categories within a mixed store. All plans include media, options, stock and direct-payment details; price tiers control active listing allowance (Business ₹2,000 / 1,000 items). Clothing requires front, back and two side photos when newly published; desktop mouse/pen hover switches cover to back and mobile uses thumbnails. Vehicle specifications include condition, kilometres, ownership, transmission and history. Buyers choose variants and quantities, then request purchases through WhatsApp. This is not a confirmed order or stock reservation. Direct UPI details/QR are seller-provided and transfers remain unverified. Product Razorpay checkout and automatic inventory settlement are a later phase distinct from the existing seller-package payment handlers.

## Brand and construction navigation — v0.7.0

User selected logo option 1: a stylised Keithel gable with upward curling roof-tip ornaments and an arched entrance, using forest green with saffron accents. Public marketplace brand is Onlinekeithel; sample seller names remain independent. Construction is one top-level navigation department containing materials, architects, builders/trades, workers, warehouse supplies and related specialists. Preserve existing category IDs and listing references; group them in the UI and search. Do not show architects or builders as separate top-level header links.

## Seller storefronts — v0.8.0

Every shop and individual has a shareable `/shop/:slug` page; old `/seller/:slug` links redirect locally. Keep a shop slug stable once published so shared links do not break. Sellers edit their cover, hero headline, tagline, introduction, preset accent/font, featured video, gallery and optional section order in the profile dashboard. Marketplace search still indexes their products independently. The domain and subdomain ideas are later work, not live routes. Storefront settings require migration 007 on an existing dedicated Supabase project; never imply sample-preview edits are saved.

## Requested next release — 9 October 2026 (design review, not implemented)

- Replace public "Open your shop" calls to action with "+ Post ad", equally suitable for individual and shop sellers.
- User requests no public sample/demo/illustrative banners. First migrate starter catalogue content into editable database records; simply hiding fixture labels does not provide real admin deletion. Use distinct, relevant photographs for different listings, and keep factual listing descriptions accurate.
- Hold the footer copyright symbol for five seconds to open admin sign-in without a public hint. The gesture only reveals the login UI; server-verified admin membership remains required. No shared password has been configured or approved for this project.
- Add a discreet same-size "Created by AviT Solutions" footer credit with coloured brand accents, linking to https://www.avitsolutions.tech/.
- Requested admin expansion: editable/deletable listings and starter content, category/subcategory creation with icons and colours, visibility and ordering, user invitations/management, homepage visual editor, draft/preview/publish workflow and revision recovery. These are proposed additions until implemented and tested with the dedicated marketplace backend.
- Two generated owner-review boards illustrate the proposed seller/customer and admin journeys. They are design concepts, not verification of live functionality. Keep the approved roof logo and existing package entitlements during implementation; generated incidental logo variations or package marketing text do not override them.


## Approved implementation — 9 October 2026, v0.9.0

- Exact brand spelling: OnlineKeithel (capital K, one final l). Wordmark uses dark-green Caveat; preserve roof/horns artwork geometry.
- Preserve approved header order and layout; yellow + Post ad serves shops and individuals.
- The user's explicit company credit is Ebit Solutions. This supersedes the earlier AviT entry; do not invent a company URL.
- Admin drafts and revisions use protected database tables; only verified admins may publish. No gesture or client-side flag grants permissions.
- Starter records can be imported into real seller accounts as drafts, then edited/published/deleted. The disconnected fixture catalogue has no live contacts or purchases. Do not claim offline catalogue edits are persisted.
- This release does not include a natural-language editor, arbitrary drag-and-drop pages, native mobile binaries, or direct product Razorpay settlement. Do not describe those as implemented.


## Approved design and rich ticker — 10 October 2026, v0.10.0

- User approved light/dark/search board and requested implementation. Keep approved roof/horns icon and OnlineKeithel wordmark; remove top announcement and full-width search field.
- Header: compact circular search, saved heart before account; ticker immediately below. Mobile posting remains in bottom navigation. Categories below hero in swipeable rail with See all categories; aggregate Construction.
- Hero changes every five seconds; pause for interaction/video/reduced motion. Admin can edit official slides and videos; existing approved paid campaigns also appear.
- Dedicated Ticker editor: per-character/word formatting, colours, five font presets, 12–36px sizes, bold/italic/underline, arbitrary pasted Unicode emojis plus palette, icons/separators, per-message destinations/scheduling/visibility/order, background/speed, undo/redo, database-backed draft/publish/revision recovery. No arbitrary HTML.
- Exact user correction: **Avit Solutions**, linked to https://www.avitsolutions.tech/. This supersedes the Ebit credit.
- Sponsored ticker placements are manually arranged and labelled; no automated ticker billing or impression reporting exists yet.
- `npm run review` enables development-only temporary admin design review on port 5189. Production cannot bypass admin auth through that route.

## Delivery and deployment — 10 October 2026

- Include Windows PowerShell installation/update commands after every build. User works in VS Code and downloads release ZIPs.
- User's new GitHub destination is `seansap-oss/onlinekeithel`; this supersedes `seansap-oss/emarket`.
- GitHub connector currently rejects writes with HTTP 403. Do not claim source was pushed or deployed without verification.

## Approved departments — v0.11.0, 11 October 2026

- User approved four category destinations: Homes & Stays, Jobs & Careers, Motors, What’s On. Preserve the horned roof logo, forest-green/saffron theme and existing marketplace.
- Property includes sale/rent/stays, PG, hotels, homestays, resorts, commercial property, land and buildings. Jobs use occupation subcategories plus employment/sector/work-arrangement fields. Recruiter pages reuse seller identity and published vacancies.
- Keep event services under existing `events`; actual dated happenings use `happenings`. Preserve old category/subcategory IDs and custom administrator entries. Motors groups vehicles, motorcycles and bicycles.
- Never invent real vacancies/events or show verification badges without verification. Event dates are entered in India time. Booking/application/WhatsApp links are handoffs, not completed transactions.
- Existing backend needs 009_departments.sql. Production backend and browser acceptance remain pending. Include Windows ZIP install commands with each release.

## Approved completion build — v0.12.0, 20 October 2026

- Option 1 Marketplace Focus is the selected homepage target: split local handloom hero, paired nearby/post actions, high-contrast forest ticker, swipeable ten-first category rail, promoted placements then a mixed fresh feed. Keep the approved logo and OnlineKeithel wordmark.
- Dark green ticker defaults use white text; the old stock welcome ticker is upgraded but editor-customized content is preserved. Campaigns must be approved, paid and currently scheduled before public display.
- Additive discovery taxonomy: Free & Wanted, Boats & Watercraft, Musical Instruments & Audio; antiques/business-for-sale/tickets/community notices are subcategories. Do not add them as top-level header links; the all-category directory is the full catalogue.
- Fixtures are local visual review only; do not expose invented public listings on production. WhatsApp remains the messaging handoff. No SMS, data persistence, admin permission, or payment is simulated when Supabase is disconnected.
- Authentication UI supports email/password/reset and Supabase phone OTP. Phone registration requires an enabled SMS provider. `/admin` is still protected by verified auth plus the private admin membership table; no hidden bypass.
- Existing storefront seller editor and admin editors are retained; verify them against the connected dedicated Supabase project before claiming launch readiness. Apply migration 010 after the existing department taxonomy and preserve administrator-added content.
- User-facing visual verification must be recorded in `design-qa.md`; current v0.12 run is blocked by the unavailable browser bridge. Don't label the build visually passed until that is rerun successfully.

## Approved hero placement build — v0.14.0, 21 October 2026

- Preserve the approved OnlineKeithel logo/wordmark and the white header/footer. Keep the marketplace mobile-first.
- The homepage hero and premium placements support photo/video/social links, destinations, schedule windows, timing, paid priority and hero/featured/both placement. Featured presentation supports swipe, feature, split, four/eight-card grids and compact list.
- The admin homepage editor controls overall layout and rotation; each hero entry can set placement, media, destination, timing and schedule. Seller campaign requests may request placement; approval and payment review remain mandatory.
- Existing Supabase databases need migration 011. Do not apply the remote migration or deploy without explicit instruction. Visual QA is still blocked until a rendered browser preview can be inspected.
- User requires a mockup approval before coding visual changes; the v0.14 mockups were approved before this implementation.

## Listing visibility and neutral canvas — 21 October 2026

- User confirmed working local email sign-in and requested every published listing appear in newest-first home discovery. Preserve private drafts and require explicit seller publishing; the seller screenshot showed the item was still Draft. Clothing publication still requires front, back and two side photos.
- The site opens in light mode even when the device prefers dark; use a neutral gray 65%-opacity wash on the content canvas. Preserve the approved header, ticker, footer, roof logo and wordmark.

## Approved simple posting and dark mode — v0.14.3, 21 October 2026

- The user approved the image mockups for a simple posting form and revised dark mode. Light mode remains white; gray/charcoal surfaces apply only to dark mode. Keep the white header/footer, dark green ticker, roof logo and wordmark.
- Posting starts with photos, title, marketplace category/subcategory, price, condition, location and search keywords. Description/colour/sizes, category extras/inventory and hosted video/social links are expandable. New listings post publicly by default; Save draft is a secondary action.
- A seller may duplicate an existing listing and replace its photos. One clothing photo is sufficient to post. Encourage useful additional photos. Optimize large phone photos in the browser to a 4 MB JPEG target and allow up to 50 gallery entries in the database.
- Clothing sizes entered without stock variants are options for a WhatsApp enquiry, with seller confirmation of availability. Direct MP4 uploading is excluded from this simplified listing editor. Do not call real connected publishing verified without testing against Supabase after migration 012.

## Photo and package correction — v0.14.4, 21 October 2026

- The uploaded Windows screenshot exposed an old database trigger requiring front, back, left and right clothing photos. The OnlineKeithel Supabase project `plllhsjsruhasdvbzhpw` still had that trigger and 12-photo check; migrations `listing_packages_v0144` and `unlimited_listing_gallery_v0144` were applied and read-only verification showed the four-angle text gone, no count-based gallery check, five active plans, and one existing draft retained. Do not claim a connected seller post was performed.
- One photo is sufficient in every category; sellers may add more without a count limit in the UI, import parser or database. Posting helper says: “One photo is enough to post. Clear photos from more angles can help buyers choose.” Compression remains behind the scenes. Per-file size and allowed image formats still apply.
- New active packages: Free, 2 ads per 14 days; Quick Seller, 5 ads for ₹100 / 14 days; Individual, 10 ads for ₹200 / 30 days; Premium Business, 20 ads for ₹400 / 30 days; Business Plus, 50 ads for ₹600 / 30 days. Old plans are inactive but existing entitlement/order records remain. Free published ads age out after 14 days and may be renewed by editing and saving; paid entitlements use the purchased duration. Paid checkout remains gated by Razorpay setup and unverified.

## Free Launch RC1 — v0.15.0, 21 October 2026

- User chose an early free marketplace launch. Public pricing and checkout are suspended; preserve historical orders and paid plan records for a later release. The new free tier allows 100 active published listings per seller without a 14-day public expiry. The dedicated project's free-launch migration was applied and its plan rows read back. Do not rerun v0.14.4 package migration after it.
- Keep one repository `seansap-oss/onlinekeithel`, one Vercel project and the user's existing Windows VS Code folder. Present push/deploy and Android Studio commands after a build. The Android project is a test APK shell; email recovery/confirmation redirects still target the web until native deep links are built.
- WhatsApp OTP is not configured; email/password is the initial sign-in route. Enquiries remain WhatsApp handoffs without an app inbox. Do not claim public launch readiness until live email delivery, seller upload, listing discovery and mobile contact are exercised.

## Build identification — v0.15.3, 21 October 2026

- User now requests a visible, discreet version at the left of the footer. Show the package version as plain `vX.Y.Z`, without any release or launch wording. Keep the current footer branding and layout.
- The Windows source ZIP keeps `docs/EMAIL-SETUP.md` inside the `docs` folder. Provide a separate copy on request, and give commands that identify the existing VS Code folder and installed package version.

## WhatsApp sign-in and package controls — v0.15.5, 22 October 2026

- User selected WhatsApp as the phone OTP channel. Keep email/password as an available sign-in fallback. The WhatsApp method uses Supabase `signInWithOtp` with `channel: "whatsapp"`; production requires Supabase phone auth plus a Twilio WhatsApp sender. Do not imply this is configured or free. MSG91 is not required for Supabase's native WhatsApp channel.
- Phone-only auth identities are separate from existing email identities unless a deliberate, verified linking flow is built. Supabase's standard `updateUser({phone})` phone-change flow sends SMS; do not tell the user an existing email account can be switched to WhatsApp without further setup.
- Admin signs in at `/admin` using their existing authorized account. Never create or expose a shared admin password. Verified membership remains enforced by `is_admin()`.
- The Admin > Packages page has a site-wide paid-packages switch using the existing protected homepage publishing RPC. Each plan also has its own `active` flag. The API refuses checkout unless both gates are on and Razorpay credentials are configured. Keep packages off until the operator intentionally enables them.
- Sellers continue to customize individual/shop pages through the existing profile editor: logo/avatar, cover, text, share URL, preset color/font, gallery, and social/video links.

## Email OTP preference — v0.15.6, 22 October 2026

- User chose email OTP as the first sign-in method. The login and signup screen requests a Supabase email code and verifies it; existing users can switch to email/password. Keep password recovery. Do not expose WhatsApp OTP in the sign-in form until the operator asks to enable it and the provider is configured.
- Supabase sends a magic link by default through `signInWithOtp`; email OTP needs the Supabase Magic Link template to display `{{ .Token }}`. Signup confirmation template may also need the code placeholder. The application source cannot configure dashboard templates or remove provider rate limits.
- Preserve the existing admin account/membership model, `/admin` route, user management, and Admin > Packages site-wide/per-plan toggles. Do not create a shared admin password. Paid package checkout still requires package switches and Razorpay credentials.

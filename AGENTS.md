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

# Design QA — v0.14.1 crash fix

The user's Edge console screenshot showed `ReferenceError: shuffle is not defined` at the homepage render. Removed the undefined calls in the homepage fixture and live listing paths. The server build and automated tests are rechecked, and the local browser should be rechecked on the user's Windows machine.

---

# Design QA — v0.14.0

Result: blocked for rendered visual acceptance. The approved shopper and admin mockups were implemented. Automated verification passes: 32 project tests, 4 Sites tests, production build and whitespace check. The browser bridge refused the local preview, so responsive visual comparison could not be completed. Inspect the release locally before deploying. The Supabase migration is included and locally validated but not applied remotely.

---

# Design QA — v0.12.0, approved Option 1

final result: blocked

Reference: `/workspace/scratch/a97ebb7391f0/generated_images/exec-ce334df2-149e-4a4a-a4b0-a46ef8cc4723.png` (approved Option 1 Marketplace Focus board).

The page changes compile and automated tests pass, but a rendered local screenshot could not be captured for same-viewport comparison. Vite runs on `127.0.0.1:4173`; the Work Mode browser returned `ERR_CONNECTION_REFUSED` for `http://terminal.local:4173/`. Binding to `0.0.0.0` failed with `uv_interface_addresses returned Unknown system error 1`. As a result, responsive layout, image crop, campaign cards and auth interactions are not visually accepted in this environment. Do not treat this as a passed design review.

Build check: `npm run build` succeeded; 29 automated tests passed. Remaining visual QA: open the v0.12.0 local preview in the user's Windows browser at desktop and phone widths, compare the landing page with Option 1, test the ticker and category rail, and inspect email/phone sign-in states. Connected Supabase behavior is a separate acceptance gate after provider setup.

---

# Design and interaction QA — 3 October 2026

Result: blocked

The desktop and 390 × 844 mobile interfaces render and are usable in local visual review. Full acceptance remains blocked by missing live services and reference-fidelity differences below; this is not a production-ready declaration.

## Evidence

- `docs/qa/desktop.jpg`: current desktop homepage, captured after a clean page load.
- `docs/qa/mobile.jpg`: 390px mobile review; heading stays within the light hero panel and fixed bottom navigation is visible.
- `docs/qa/comparison.jpg`: approved design board beside implementation, each proportionally fitted without stretching. This is a visual comparison, not a pixel-diff test.

## Confirmed

Forest-green category bar, saffron actions, serif headings, local handloom hero, four-column desktop products and two-column mobile products preserve the chosen visual direction. The hamburger precedes the logo. Mobile drawer exposes categories and seller links. Desktop has no compact bottom navigation. Pinch zoom is not disabled.

Browser checks cover keyword search, product enquiry, seller category-specific fields, social inputs, admin preview navigation and editing dialog. The admin removal action is now inside the modal and reachable. The real `/admin` route displays the sign-in gate, with sign-in disabled while account services are unconfigured. Development previews do not grant a real session.

A clean desktop page load reported no application errors; one browser-extension metadata error was unrelated to the app. Previous hot-reload context error did not reproduce after reload.

## Differences still requiring design acceptance

The implemented desktop uses more generous header, hero and section spacing than the approved board. Product photography is substituted with available/generated assets; the illustrative logo is replaced by a consistent storefront icon. Homepage microcopy is expanded. The mobile hero is taller and places category shortcuts after the hero. These are not exact reference matches. No exact visual-parity claim is made.

## External acceptance

Real signup, uploads, subscription payments, social embeds on physical phones, installed PWA behaviour and deployed response headers require configured services/device testing. See BUILD-STATUS.md for scope and launch requirements.

## v0.4.0 showcase continuation

The user requested public production samples and distinct category templates. The existing homepage visual direction is retained. /templates now provides five category choices; sample shop pages have ten working collections in total. Browser review confirms motorcycle selection, navigation to Leikai Rides, and Touring filtering from three products down to one. A low-contrast paragraph on dark template panels was corrected. Template screenshot: docs/qa/templates-v040.jpg. Automated showcase integrity tests pass and the production build emits the sample catalogue chunk. A separate browser production-preview port was blocked by the browser client, so interactive review used the managed development preview. Remote deployment of this update remains blocked by GitHub integration write permissions.

## v0.5.0 categories

Reviewed the category directory in the managed browser, including warehouse keyword search, Pallet racks navigation and Build & industry grouping. Screenshot: docs/qa/categories-v050.jpg. Department icons use the existing Phosphor visual style. Responsive CSS provides three/two/one columns; physical mobile verification is still pending. Production build passes.

## v0.6.0 product tools

Browser checked at desktop and 390px width. Clothing mouse hover switches to back view; a pointer event implementation supports mouse/pen without triggering sticky hover on touch. Mobile thumbnails change the main photo without horizontal overflow. Selecting M and quantity 2 produces ₹1,300 for the sample T-shirt; sample enquiries expose no WhatsApp link. Sold-out toys disable purchase requests. Mixed-store electrical filtering returns the batteries only. Seller preview verified photo reordering, category-dependent vehicle fields, and video URL entry. Browser error report was empty. Screenshot files: product-v060.png, product-mobile-v060.png, seller-editor-v060.png in docs/qa. Full-page screenshots include the fixed compact navigation at the capture viewport boundary. Real device and connected-service checks remain pending.
# Design QA — v0.14.3 simple posting and dark mode

The managed local browser rendered the seller workspace and opened Add product. The posting panel places photos, title, category/subcategory, price, condition, location and keywords before three folded optional sections and the public/draft actions. The seller page initially crashed because `LinkSimple` was referenced but not imported; fixed and rerendered successfully. The dark homepage and seller workspace rendered with neutral charcoal content, legible hero text, and the original white header and dark green ticker. Light mode retained its white canvas. Mobile viewport and connected Supabase save/upload have not been exercised in this browser; acceptance remains pending on the user's Windows setup.

---
# Design QA — v0.14.4 photo and packages

The user screenshot showed a one-photo fashion listing with a red “Add front, back, left and right clothing photos” error. The live database function contained that rule. After the migrations, the function no longer contains it, the gallery constraint checks only that photos form an array, and the draft count remained one. The local browser `/plans` page rendered the five new tiers with 14/30-day labels, 2/5/10/20/50 active ads and ₹0/₹100/₹200/₹400/₹600 prices. Connected seller posting and payment were not exercised in this workspace.

---

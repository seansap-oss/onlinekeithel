# OnlineKeithel (v0.15.6)

A mobile-first Manipur marketplace with shop and individual pages, searchable listings, email-code sign-in, WhatsApp enquiries, an admin editor, a PWA and an Android Studio test project.

## What the free release does

- Account creation and sign-in with Supabase email OTP. Existing account holders can use email/password as a fallback; password recovery remains available.
- A seller can publish up to 100 active listings. Published ads stay visible until paused or removed; one photo is sufficient, and extra photos are welcome.
- Buyers find listings by category, shop and keyword. Contact buttons open WhatsApp with an enquiry; sending happens in WhatsApp.
- Seller storefronts, uploads and editing, administrator controls, hero/ticker editors and PWA remain available. Admin can enable paid packages globally and per plan; checkout also requires Razorpay credentials. Existing payment and entitlement records are preserved.

**Launch status:** local tests and build pass. The live release still needs two-account signup/posting/enquiry testing, a production email sender, mobile checks and final operator/contact details. See [BUILD-STATUS.md](BUILD-STATUS.md).

Account email setup for the existing Vercel site and a later host move: [docs/EMAIL-SETUP.md](docs/EMAIL-SETUP.md). The website does not store an SMTP password; Supabase Auth sends confirmation and recovery emails through the configured provider.

## One Windows folder and one Vercel project

Use the existing project folder in VS Code. In its PowerShell terminal, check `git status` before replacing files. If you use the release ZIP, extract its contents *into that same repository folder*; do not create a second repository or Vercel project. Keep your `.env.local` in that folder and never commit it.

```powershell
npm ci
npm test
npm run build
npm run dev
```

Vite prints the local URL, usually `http://localhost:5173`. Production uses the existing GitHub repository `seansap-oss/onlinekeithel` and the existing OnlineKeithel Vercel project. The current Vercel project is a CLI deployment, so deploy it explicitly after pushing GitHub. The build command is `npm run build`, output `dist/client`.

The v0.15.6 source ZIP contains project files at its root. In the **existing** repository folder, check `git status` and save any personal edits before copying the ZIP's contents into the same folder. The ZIP excludes `.git`, `.env.local`, `node_modules` and build output, so it does not create another repository or overwrite the local keys. After installing, build and test with the commands above. A GitHub push alone does not guarantee a Vercel deployment when the project was linked through the CLI; use the existing linked Vercel project and verify the live address after deployment.

### Database

On a database that already has the v0.14.4 migrations, apply `database/migrations/015_free_launch.sql` **once** if it has not already been applied by the maintainer. It turns off paid plans, raises the free active-listing allowance to 100 and removes the 14-day public visibility rule. Do not re-run the old package migration after this one. A production custom SMTP provider and Supabase Auth Site URL/redirects are required for public email signup. The public `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` belong in `.env.local` for the local or Android build and in the existing Vercel project's environment variables for the website. Never put the service role key in any `VITE_` variable.

### Android Studio test APK

Node 22+ and Android Studio with the SDK are required. The `android/` project and Capacitor config are included. In the same VS Code PowerShell terminal, after `.env.local` is set:

```powershell
npm ci
npm run android:sync
npm run android:open
```

Android Studio opens the generated project; let Gradle finish syncing, select an emulator or USB-connected Android phone and press **Run**. For an installable debug APK select **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The output is `android/app/build/outputs/apk/debug/app-debug.apk`. After changing web code, run `npm run android:sync` again before building the APK. The debug APK is for testing, not Play Store release. Email confirmation links still open the website; afterwards sign in inside the APK. Native deep-link handling, notification delivery and release signing are future work.

## Security and operations

Admin access is by an authenticated account in `public.admins`, never a shared password. Sellers cannot grant themselves admin access or publish another seller's listings. Photos go to Supabase Storage; the website and APK use the same hosted database. A Vercel build alone does not verify signup, SMTP, image upload or live mobile WhatsApp handoff. Finish the checks in BUILD-STATUS.md before inviting sellers.

# OnlineKeithel account email setup

Keep the current public address `https://onlinekeithel.vercel.app` during testing. A hosting move does not require a new Supabase project or new user accounts.

## 1. Set the website's public destination

In the existing Vercel project, add `VITE_PUBLIC_SITE_URL` with the exact value `https://onlinekeithel.vercel.app` under Production environment variables, then redeploy the existing project. In the existing Windows VS Code folder, put the same variable in `.env.local` alongside `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then rebuild. These are public build settings. Never put an SMTP password or Supabase service role key in a `VITE_` variable.

Both signup confirmation and reset requests now use this public destination, even when the request originates in a local development build. For a deliberately local email test, set `VITE_PUBLIC_SITE_URL=http://localhost:5173` only in the local `.env.local` and add that origin to Supabase's redirect allow list. Change the public URL only after a new domain is ready, then rebuild the site and Android assets.

## 2. Fix Supabase redirect configuration

In the **existing** Supabase project `plllhsjsruhasdvbzhpw`, open **Authentication → URL Configuration**:

- Site URL: `https://onlinekeithel.vercel.app`
- Additional Redirect URLs: `https://onlinekeithel.vercel.app/dashboard` and `https://onlinekeithel.vercel.app/reset-password`. Confirmation lands at the dashboard; recovery lands at the password form. The base Site URL can remain in the list too.
- During local-only testing, additionally allow `http://localhost:5173/**` (or the exact development port actually printed by Vite). Do not make localhost the Site URL for the public service.

If email templates have been customized, check the confirmation/recovery links use Supabase's `{{ .ConfirmationURL }}` so the `redirectTo` value from the application survives. The hosting rewrite must serve the SPA at `/reset-password` and `/dashboard`; the current Vercel config already routes these to `index.html`.

## 2a. Enable six-digit email sign-in codes

The sign-in page uses Supabase email OTP for new and existing accounts. In the existing Supabase project, open **Authentication → Email Templates → Magic Link** and change the template body so it displays the code, for example:

```html
<h2>Your OnlineKeithel sign-in code</h2>
<p>Enter this code in OnlineKeithel: <strong>{{ .Token }}</strong></p>
```

Keep the **Confirm signup** template code-based too if your project requires email confirmation for new accounts; it must display `{{ .Token }}`. Supabase documents that `signInWithOtp` sends a magic link by default until the email template is changed. Password sign-in remains available for existing accounts. This template edit is done in the Supabase dashboard; the source ZIP cannot change it remotely.

## 3. Connect a transactional email provider

Create and verify a sending domain with a transactional SMTP provider (for example Brevo). Follow that provider's DNS steps for SPF, DKIM and DMARC. In **Supabase → Authentication → SMTP Settings**, enable custom SMTP and enter the provider's host, port, SMTP login, SMTP key/password, and a verified sender such as `no-reply@your-domain` with display name `OnlineKeithel`. Keep these credentials exclusively in the provider and Supabase dashboards. An ordinary hosting mailbox alone does not configure Supabase Auth.

Supabase's built-in sender permits only two project-wide auth emails per hour and is unsuitable for public registration. After custom SMTP is saved, Supabase initially applies its own 30-emails-per-hour limit; review **Authentication → Rate Limits** and the provider's daily/hourly quota before inviting many people. Do not disable reasonable per-address resend limits. A failed request caused by a provider limit cannot be fixed in frontend code.

## 4. Verify the actual delivery

1. In a private browser window, create a fresh account with an address you control. Enter the six-digit code from the email and confirm that you land on the public site.
2. Sign out, request a sign-in code for that email and verify it. Also test the password fallback and request a reset once; confirm the reset email lands on `/reset-password`.
3. Repeat with a second controlled email address, then verify a seller post from one account is visible to the other. Inspect Supabase Auth logs if a request fails. Do not send repeated resets while the project is rate limited.
4. On Android, the confirmation and recovery links open the website; after confirmation, sign in in the APK. Native deep links have not been implemented.

For Hostinger Single later: upload the built `dist/client` assets with an SPA fallback for account routes; move the existing Vercel `/api` server handlers to a supported backend before changing the domain. Re-run the email and seller acceptance checks on the final HTTPS domain.

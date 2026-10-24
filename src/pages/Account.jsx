Warning: truncated output (original token count: 7499)
Total output lines: 854

import { normalizePayments } from "../lib/commerce";
import { accountEmailUrl } from "../lib/auth-url";
import { templateForCategory, templates } from "../lib/templates";
import React, { useState, useEffect } from "react";
import {
  Storefront,
  ArrowRight,
  Check,
  ShieldCheck,
  WhatsappLogo,
  ArrowLeft,
  SignOut,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";
import { useMarket, Link } from "../lib/context";
import {
  configured,
  requireBackend,
  supabase,
  result,
  preview,
  checkout,
} from "../lib/backend";
import { Field, Upload, Empty, Photo } from "../components/UI";
import { CategoryOptions } from "../components/CategoryOptions";
import { slugify, socialUrl, whatsappUrl, mediaUrl } from "../lib/utils";
import {
  storefrontColors,
  storefrontFonts,
  storefrontSettings,
  storefrontSections,
  shopPath,
} from "../lib/storefront";
export function AuthPage({ reset = false, returnTo }) {
  const { session, navigate, notice } = useMarket();
  const [mode, setMode] = useState("login"),
    [email, setEmail] = useState(""),
    [otp, setOtp] = useState(""),
    [otpSent, setOtpSent] = useState(false),
    [passwordMode, setPasswordMode] = useState(true),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [passwordVisible, setPasswordVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState("");
  useEffect(() => {
    if (session && !reset) navigate(destination);
  }, [session, reset]);
  const chosenTemplate = new URLSearchParams(location.search).get("template");
  const destination =
    returnTo ||
    (location.pathname === "/admin" ? "/admin" : null) ||
    (Object.hasOwn(templates, chosenTemplate)
      ? "/dashboard?template=" + chosenTemplate
      : "/account");
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    try {
      const s = requireBackend();
      if (reset) {
        if (!session)
          throw Error("Open the password reset link sent to your email first.");
        await result(s.auth.updateUser({ password }));
        notice("Password updated");
        navigate(destination);
      } else if (mode === "forgot") {
        await result(s.auth.resetPasswordForEmail(email, { redirectTo: accountEmailUrl("/reset-password") }));
        setDone("If this email has an account, a password reset link will arrive shortly.");
      } else if (mode === "login" && passwordMode) {
        await result(s.auth.signInWithPassword({ email, password }));
        navigate(destination);
      } else if (mode === "signup") {
        if (password !== confirmPassword)
          throw Error("Your passwords do not match.");
        const { data } = await result(
          s.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: accountEmailUrl(destination) },
          }),
        );
        if (data.session) navigate(destination);
        else
          setDone(
            "Your account is created. Check your email and confirm your address. You’ll be signed in after confirmation.",
          );
      } else if (!otpSent) {
        await result(s.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } }));
        setOtpSent(true);
        setDone("A one-time sign-in code has been sent to " + email.trim() + ".");
      } else {
        await result(s.auth.verifyOtp({ email: email.trim(), token: otp.trim(), type: "email" }));
        navigate(destination);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page auth-layout">
      <div className="auth-story">
        <Storefront size={54} weight="light" />
        <span className="eyebrow">A PLACE FOR YOUR NEXT CHAPTER</span>
        <h1>
          Your people.
          <br />
          Your products.
          <br />
          Your own little corner.
        </h1>
        <p>Join a marketplace that feels like your neighbourhood.</p>
        <ul>
          <li>
            <Check /> Create your shop and post for free
          </li>
          <li>
            <Check /> Your own shop link and identity
          </li>
          <li>
            <Check /> Enquiries straight to WhatsApp
          </li>
        </ul>
      </div>
      <div className="auth-form">
        <h2>{!reset && returnTo === "/admin"
          ? "Administrator sign in"
          : reset
            ? "Choose a new password"
            : mode === "login"
              ? "Welcome back"
              : mode === "signup"
                ? "Make yourself at home"
                : "Reset your password"}</h2>
        <p>
          {mode === "signup"
            ? "One account to discover, save and sell."
            : "Good things are waiting around the corner."}
        </p>
        {!configured && (
          <div className="notice-box">
            Account services are awaiting connection. You can explore the
            marketplace design, but sign-up is not live yet.
          </div>
        )}
        {!reset && mode === "login" && passwordMode && (
          <p className="auth-hint">Sign in with your email address and password.</p>
        )}
        {!reset && mode === "login" && !passwordMode && (
          <p className="auth-hint">We’ll email you a one-time sign-in code.</p>
        )}
        <form onSubmit={submit}>
          {!reset && (
            <Field
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          {!reset && mode === "login" && !passwordMode && otpSent && (
            <>
              <Field
                label="Email verification code"
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                minLength={6}
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <button
                type="button"
                className="text-button muted"
                onClick={() => { setOtpSent(false); setOtp(""); setError(""); setDone(""); }}
              >
                Send a new code
              </button>
            </>
          )}
          {(reset || (passwordMode && mode === "login")) && (
            <Field
              label="Password"
            >
              <div className="password-field">
                <input
                  type={passwordVisible ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-visibility"
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                  aria-pressed={passwordVisible}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  {passwordVisible ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </Field>
          )}
          {mode === "signup" && (
            <>
              <Field label="Create password">
                <div className="password-field">
                  <input type={passwordVisible ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="password-visibility" aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)}>{passwordVisible ? <EyeSlash size={20} /> : <Eye size={20} />}</button>
                </div>
              </Field>
              <Field label="Confirm password">
                <input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </Field>
            </>
          )}
          <button
            className="button primary full"
            disabled={busy || !configured}
          >
            {busy
              ? "Please wait…"
              : reset
                ? "Update password"
                : mode === "forgot"
                  ? "Send reset link"
                  : mode === "login" && passwordMode
                    ? "Sign in"
                    : mode === "signup"
                      ? "Create account"
                    : otpSent
                      ? "Verify email code"
                      : "Send sign-in code"}
            <ArrowRight size={18} />
          </button>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {done && (
            <p className="notice-box" role="status">
              {done}
            </p>
          )}
        </form>
        {!reset && (
          <>
            <button
              className="text-button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setOtpSent(false);
                setOtp("");
                setPasswordMode(false);
                setPassword("");
                setConfirmPassword("");
                setError("");
                setDone("");
              }}
            >
              {mode === "login"
                ? "New here? Create …2499 tokens truncated…    }
          >
            {Object.entries(storefrontColors).map(([key, choice]) => (
              <option key={key} value={key}>
                {choice.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Headline font">
          <select
            value={form.storefront?.font || "classic"}
            onChange={(e) =>
              change("storefront", { ...form.storefront, font: e.target.value })
            }
          >
            {Object.entries(storefrontFonts).map(([key, choice]) => (
              <option key={key} value={key}>
                {choice.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Welcome message">
        <textarea
          maxLength={1200}
          rows={3}
          value={form.storefront?.introduction ?? ""}
          placeholder={form.description || "Introduce your shop to visitors"}
          onChange={(e) =>
            change("storefront", {
              ...form.storefront,
              introduction: e.target.value,
            })
          }
        />
      </Field>
      <Field
        label="Featured video URL (optional)"
        type="url"
        placeholder="YouTube, Instagram or Facebook link"
        value={form.storefront?.videoUrl ?? ""}
        onChange={(e) =>
          change("storefront", { ...form.storefront, videoUrl: e.target.value })
        }
      />
      <h4>Shop photo gallery</h4>
      <Upload
        multiple
        maxItems={6}
        value={form.storefront?.gallery || []}
        onBusyChange={(v) => setUploads((p) => ({ ...p, gallery: v }))}
        onChange={(v) =>
          change("storefront", { ...form.storefront, gallery: v })
        }
      />
      <div
        className={"storefront-preview theme-" + form.theme}
        style={{
          "--shop-accent":
            storefrontColors[storefrontSettings(form).color].value,
          "--shop-font": storefrontFonts[storefrontSettings(form).font].value,
        }}
      >
        <Photo src={form.cover} alt="Your cover photo preview" />
        <div>
          <span>YOUR STOREFRONT PREVIEW</span>
          <strong>{storefrontSettings(form).headline}</strong>
          <p>{storefrontSettings(form).tagline}</p>
          <small>{storefrontSettings(form).introduction}</small>
        </div>
      </div>
      <label className="check-field">
        <input
          type="checkbox"
          checked={form.storefront?.showAbout !== false}
          onChange={(e) =>
            change("storefront", {
              ...form.storefront,
              showAbout: e.target.checked,
            })
          }
        />
        Show an About section
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={form.storefront?.showGallery !== false}
          onChange={(e) =>
            change("storefront", {
              ...form.storefront,
              showGallery: e.target.checked,
            })
          }
        />
        Show the photo gallery
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={form.storefront?.showVideo !== false}
          onChange={(e) =>
            change("storefront", {
              ...form.storefront,
              showVideo: e.target.checked,
            })
          }
        />
        Show a featured video section
      </label>
      <h4>Section order</h4>
      <p className="muted">
        Move these sections above the product catalogue. Empty or hidden
        sections will not appear.
      </p>
      <div className="storefront-section-order">
        {storefrontSettings(form).sections.map((section, index, ordered) => (
          <div key={section}>
            <span>
              {index + 1}.{" "}
              {section === "about"
                ? "About"
                : section === "gallery"
                  ? "Photo gallery"
                  : "Featured video"}
            </span>
            <button
              type="button"
              disabled={index === 0}
              aria-label={`Move ${section} section up`}
              onClick={() => {
                const next = [...ordered];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                change("storefront", { ...form.storefront, sections: next });
              }}
            >
              ↑
            </button>
            <button
              type="button"
              disabled={index === storefrontSections.length - 1}
              aria-label={`Move ${section} section down`}
              onClick={() => {
                const next = [...ordered];
                [next[index + 1], next[index]] = [next[index], next[index + 1]];
                change("storefront", { ...form.storefront, sections: next });
              }}
            >
              ↓
            </button>
          </div>
        ))}
      </div>
      <h3>Payment & collection options</h3>
      <p className="muted">
        Published on your product pages. Buyers confirm stock and delivery with
        you before paying. The marketplace does not verify direct UPI transfers.
      </p>
      <div className="form-grid">
        {[
          ["upi_id", "UPI ID"],
          ["upi_name", "UPI recipient name"],
        ].map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={form.payment_options?.[key] || ""}
            onChange={(e) =>
              change("payment_options", {
                ...form.payment_options,
                [key]: e.target.value,
              })
            }
          />
        ))}
      </div>
      <h4>UPI QR photo (optional)</h4>
      <Upload
        onBusyChange={(v) => setUploads((p) => ({ ...p, qr: v }))}
        value={form.payment_options?.upi_qr || ""}
        onChange={(v) =>
          change("payment_options", { ...form.payment_options, upi_qr: v })
        }
      />
      {["cash_on_collection", "cash_on_delivery"].map((key) => (
        <label className="check-field" key={key}>
          <input
            type="checkbox"
            checked={!!form.payment_options?.[key]}
            onChange={(e) =>
              change("payment_options", {
                ...form.payment_options,
                [key]: e.target.checked,
              })
            }
          />
          {key === "cash_on_collection"
            ? "Cash on collection"
            : "Cash on delivery (confirm service area)"}
        </label>
      ))}
      <Field label="Payment / delivery instructions">
        <textarea
          maxLength={500}
          value={form.payment_options?.instructions || ""}
          onChange={(e) =>
            change("payment_options", {
              ...form.payment_options,
              instructions: e.target.value,
            })
          }
        />
      </Field>
      <h3>Stay connected</h3>
      {["instagram", "facebook", "youtube"].map((k) => (
        <Field
          key={k}
          label={k + " profile URL"}
          type="url"
          value={form.socials[k] || ""}
          onChange={(e) =>
            change("socials", { ...form.socials, [k]: e.target.value })
          }
        />
      ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="button primary"
        disabled={busy || Object.values(uploads).some(Boolean)}
      >
        {busy ? "Saving…" : "Save shop identity"}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
export function Plans() {
  const { settings, plans, session, seller, navigate, notice } = useMarket();
  const [busyPlan, setBusyPlan] = useState("");
  const available = plans.filter((plan) => plan.active && Number(plan.price) > 0);
  const choose = async (plan) => {
    if (!session) return navigate("/login");
    if (!seller) return navigate("/dashboard");
    setBusyPlan(plan.id);
    try {
      await checkout(plan.id);
      notice("Package payment confirmed and your allowance is updated.");
    } catch (e) {
      notice(e.message);
    } finally {
      setBusyPlan("");
    }
  };
  return (
    <div className="page narrow">
      <div className="pricing-intro">
        <span className="eyebrow">ONLINEKEITHEL</span>
        <h1>Your own corner of the market.</h1>
        <p>Create a shop or individual profile, share your link, and post products across categories. Buyers can contact you directly on WhatsApp.</p>
        <p>Add clear photos and useful details so buyers can find the right item. You can update or remove your listings from your account.</p>
        <Link className="button primary" to="/sell">Post your first ad <ArrowRight size={18} /></Link>
      </div>
      {settings.payments_enabled && (
        <section className="package-cards" aria-labelledby="seller-packages-heading">
          <h2 id="seller-packages-heading">Seller packages</h2>
          <p>Choose an active package if you need a higher listing allowance.</p>
          {available.length ? (
            <div className="plan-grid">
              {available.map((plan) => (
                <article className="plan-card" key={plan.id}>
                  <h3>{plan.name}</h3>
                  <strong className="plan-price">₹{Number(plan.price).toLocaleString("en-IN")}</strong>
                  <p>Up to {plan.listing_limit} active ads · {plan.duration_days || 30} days</p>
                  <button className="button primary" disabled={!!busyPlan} onClick={() => choose(plan)}>
                    {busyPlan === plan.id ? "Opening secure checkout…" : "Choose package"}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No paid packages are active right now.</p>
          )}
        </section>
      )}
    </div>
  );
}

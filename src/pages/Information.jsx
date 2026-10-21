import React from "react";
import { WhatsappLogo, Envelope, ArrowRight } from "@phosphor-icons/react";
import { useMarket, Link } from "../lib/context";
import { whatsappUrl } from "../lib/utils";
export function Information({ kind }) {
  const { settings } = useMarket();
  const titles = {
    help: "A little help, when you need it.",
    privacy: "Your privacy matters.",
    terms: "A good marketplace starts with respect.",
  };
  return (
    <div className="page prose info-page">
      <span className="eyebrow">ONLINEKEITHEL</span>
      <h1>{titles[kind]}</h1>
      {kind === "help" ? (
        <>
          <h2>How do I start selling?</h2>
          <p>
            Create your account, choose individual or shop, add your public
            WhatsApp number and customise your profile. Use Sell to add a
            product with photos, a price and category.
          </p>
          <Link className="button primary" to="/sell">
            Post ad <ArrowRight />
          </Link>
          <h2>Where do messages go?</h2>
          <p>
            Write an enquiry on a product page, then continue to WhatsApp. You
            press Send there. We do not maintain an inbox or store the message.
          </p>
          <h2>Contact the marketplace</h2>
          {settings.support_email && (
            <a
              className="button outline"
              href={"mailto:" + settings.support_email}
            >
              <Envelope />
              {settings.support_email}
            </a>
          )}
          {whatsappUrl(
            settings.support_whatsapp,
            "Hello, I need help with OnlineKeithel.",
          ) && (
            <a
              className="button green"
              href={whatsappUrl(
                settings.support_whatsapp,
                "Hello, I need help with OnlineKeithel.",
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsappLogo /> Support on WhatsApp
            </a>
          )}
          {!settings.support_email && !settings.support_whatsapp && (
            <p>Marketplace support contact details are not available yet.</p>
          )}
        </>
      ) : kind === "privacy" ? (
        <>
          <p>
            We use account details to sign you in, manage your listings and
            manage your seller account. Public shop details, product photographs
            and your chosen WhatsApp number are visible to visitors.
          </p>
          <h2>WhatsApp enquiries</h2>
          <p>
            Enquiry text is kept only in the open page until you continue to
            WhatsApp. WhatsApp handles delivery and the subsequent conversation
            under its own privacy terms.
          </p>
          <h2>External content</h2>
          <p>
            Social videos load from their original platforms when you choose to
            play them. Those providers may receive your IP address and browser
            information. You can use the original link instead.
          </p>
          <h2>Account and billing data</h2>
          <p>
            Authentication is handled through Supabase. The marketplace does not
            process seller payments. Buyers and sellers arrange payment through
            WhatsApp. Contact support to request access to, correction or
            deletion of your account data.
          </p>
        </>
      ) : (
        <>
          <p>
            This marketplace connects buyers with individual sellers and shops.
            Product purchases, payment and collection are arranged directly with
            the seller through WhatsApp.
          </p>
          <h2>Listings</h2>
          <p>
            Publish accurate information and only photos or videos you have
            permission to use. Do not post illegal goods, misleading claims,
            duplicate spam or private information belonging to others. The
            marketplace can remove listings or suspend sellers who misuse it.
          </p>
          <h2>Seller accounts and listings</h2>
          <p>
            Buyers and sellers arrange payment and collection directly with each
            other. Featured homepage content is selected by the marketplace
            team. We do not promise external social-media views or sales.
          </p>
        </>
      )}
    </div>
  );
}

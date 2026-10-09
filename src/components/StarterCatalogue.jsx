import React, { useEffect, useState } from "react";
import { useMarket } from "../lib/context";
import { supabase, result } from "../lib/backend";
import { Field } from "./UI";
export function StarterCatalogue({ visual = false }) {
  const { notice } = useMarket();
  const [sellers, setSellers] = useState([]),
    [sellerId, setSellerId] = useState(""),
    [theme, setTheme] = useState("general"),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!visual)
      result(
        supabase.from("sellers").select("id,name").order("name").limit(500),
      )
        .then(setSellers)
        .catch((e) => notice(e.message));
  }, []);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          if (visual)
            throw Error("Connect an administrator account to import products.");
          const catalogue = await import("../lib/preview-data.js");
          const source = catalogue.sellers.find((s) => s.theme === theme);
          const fields = [
            "category_id",
            "subcategory_id",
            "title",
            "description",
            "price",
            "condition",
            "location",
            "images",
            "socials",
            "attributes",
            "tags",
            "commerce",
            "videos",
          ];
          const records = catalogue.listings
            .filter((p) => p.seller_id === source.id)
            .map((p) => ({
              ...Object.fromEntries(
                fields.filter((k) => p[k] !== undefined).map((k) => [k, p[k]]),
              ),
              seller_id: sellerId,
              status: "draft",
              sku: "starter-" + p.id,
            }));
          const imported = await result(
            supabase
              .from("listings")
              .upsert(records, {
                onConflict: "seller_id,sku",
                ignoreDuplicates: true,
              })
              .select("id"),
          );
          notice(
            `${imported.length} products imported as editable drafts. Review photos, details and prices before publishing.`,
          );
        } catch (e) {
          notice(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Starter catalogue</h2>
      <p>
        Copy template products into a real seller’s account. These become
        database records you can edit, publish or delete in Listings. Existing
        imports are preserved.
      </p>
      <Field label="Seller account">
        <select
          required
          value={sellerId}
          onChange={(e) => setSellerId(e.target.value)}
        >
          <option value="">Choose a registered seller</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Store template">
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          {[
            ["general", "Variety store"],
            ["fashion", "Clothing"],
            ["electronics", "Electronics"],
            ["vehicles", "Cars"],
            ["motorcycles", "Motorcycles"],
          ].map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <p className="notice-box">
        Products start as drafts. Add accurate photographs, descriptions,
        availability and prices before making them public. Publishing follows
        the seller’s package allowance.
      </p>
      <button className="button primary" disabled={busy}>
        {busy ? "Importing…" : "Import editable drafts"}
      </button>
    </form>
  );
}

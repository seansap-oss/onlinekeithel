import { isClassified, validateClassified } from "../lib/departments";
import { InventoryEditor } from "../components/ProductOptions";
import {
  normalizeCommerce,
  normalizeVideos,
  normalizeProductImport,
  productFields,
  fieldOptions,
} from "../lib/commerce";
import { ProductVideosEditor } from "../components/ProductMedia";
import { subcategoriesFor } from "../lib/categories";
import { CategoryOptions } from "../components/CategoryOptions";
import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import {
  Plus,
  Package,
  Storefront,
  Stack,
  UploadSimple,
  Megaphone,
  ArrowSquareOut,
  PencilSimple,
  Trash,
  DownloadSimple,
  SignOut,
  ShieldCheck,
  ArrowRight,
  CopySimple,
  LinkSimple,
} from "@phosphor-icons/react";
import { useMarket, Link } from "../lib/context";
import { result, supabase, preview } from "../lib/backend";
import { money, socialUrl, normalizeImport, safeUrl } from "../lib/utils";
import { Modal, Field, Photo, Upload, Empty } from "../components/UI";
import { SellerForm } from "./Account";
import { shopPath } from "../lib/storefront";
export function ListingEditor({
  seller,
  initial,
  duplicateFrom,
  existingListings = [],
  onClose,
  onSaved,
  collections = [],
  visual = false,
  moderationAction,
}) {
  const { categories, notice, path } = useMarket();
  const requestedCategory = new URLSearchParams(path.split("?")[1]).get(
    "category",
  );
  const [f, setF] = useState(
      initial || (duplicateFrom ? { ...duplicateFrom, id: undefined, images: [], sku: "", status: "published" } : null) || {
        title: "",
        price: "",
        category_id: categories.some((c) => c.id === requestedCategory)
          ? requestedCategory
          : categories[0]?.id || "fashion",
        collection_id: "",
        description: "",
        condition: "New",
        location: seller.location,
        images: [],
        socials: {},
        attributes: {},
        commerce: {
          mode: "retail",
          stock: null,
          variants: [],
          unit: "item",
          delivery: "Arrange with seller",
        },
        tags: "",
        sku: "",
        status: "published",
      },
    ),
    [photoBusy, setPhotoBusy] = useState(false),
    [videoBusy, setVideoBusy] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const update = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal
      title={initial ? "Edit your listing" : "Post an ad"}
      side
      onClose={onClose}
    >
      <form className="posting-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (photoBusy || videoBusy) return;
          const action = e.nativeEvent.submitter?.value;
          const status = action === "draft" ? "draft" : action === "keep" ? f.status : "published";
          setBusy(true);
          setError("");
          try {
            if (visual)
              throw Error(
                "Visual review only. Connect the database and sign in to publish.",
              );
            for (const u of Object.values(f.socials))
              if (u && !socialUrl(u))
                throw Error("Add a valid social platform URL");
            validateClassified({ ...f, status });
            const payload = {
              seller_id: seller.id,
              title: f.title,
              price: Number(f.price),
              category_id: f.category_id,
              subcategory_id: f.subcategory_id || null,
              collection_id: f.collection_id || null,
              description: f.description,
              condition: f.condition,
              location: f.location,
              images: f.images,
              socials: f.socials,
              attributes: f.attributes,
              commerce: normalizeCommerce(
                isClassified(f.category_id)
                  ? { mode: "enquiry", stock: null, variants: [] }
                  : f.commerce,
              ),
              videos: normalizeVideos(f.videos),
              tags: f.tags,
              sku: f.sku || null,
              status,
            };
            await result(
              initial
                ? supabase.from("listings").update(payload).eq("id", initial.id)
                : supabase.from("listings").insert(payload),
            );
            notice(status === "published" ? "Ad posted publicly" : "Draft saved");
            onSaved();
            onClose();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {!initial && existingListings.length > 0 && (
          <Field label="Duplicate from an existing listing">
            <select
              value=""
              onChange={(e) => {
                const source = existingListings.find((item) => item.id === e.target.value);
                if (source) setF({ ...source, id: undefined, images: [], sku: "", status: "published" });
              }}
            >
              <option value="">Choose an ad to copy, then replace its photos</option>
              {existingListings.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </Field>
        )}
        <h3>Photos</h3>
        <Upload
          multiple
          value={f.images}
          labels={[]}
          onBusyChange={setPhotoBusy}
          onChange={(v) => update("images", v)}
        />
        <Field
          label={
            f.category_id === "jobs"
              ? "Job title"
              : f.category_id === "happenings"
                ? "Event title"
                : "Listing title"
          }
          required
          minLength={3}
          maxLength={160}
          placeholder={
            f.category_id === "jobs"
              ? "e.g. Front desk assistant"
              : f.category_id === "happenings"
                ? "e.g. Weekend food market"
                : "Give your listing a clear title"
          }
          value={f.title}
          onChange={(e) => update("title", e.target.value)}
        />
        <div className="listing-basics">
          <Field label="Marketplace category">
            <select
              value={f.category_id}
              onChange={(e) => {
                update("category_id", e.target.value);
                update("subcategory_id", "");
                update("attributes", {});
                update("commerce", {
                  mode: [
                    "vehicles",
                    "motorcycles",
                    "property",
                    "services",
                    "architecture",
                    "contractors",
                    "logistics",
                    "education",
                    "events",
                    "business",
                  ].includes(e.target.value)
                    ? "enquiry"
                    : "retail",
                  stock: null,
                  variants: [],
                  unit: "item",
                  delivery: "Arrange with seller",
                });
              }}
            >
              <CategoryOptions categories={categories} />
            </select>
          </Field>
          <Field label="Subcategory">
            <select
              value={f.subcategory_id || ""}
              required={subcategoriesFor(categories, f.category_id).length > 0}
              onChange={(e) => update("subcategory_id", e.target.value)}
            >
              <option value="">Choose a subcategory</option>
              {subcategoriesFor(categories, f.category_id).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={
              f.category_id === "jobs"
                ? "Starting salary / pay (₹; 0 if undisclosed)"
                : f.category_id === "happenings"
                  ? "Entry price (₹; 0 for free)"
                  : "Price (₹)"
            }
            required
            type="number"
            min="0"
            step="0.01"
            value={f.price}
            onChange={(e) => update("price", e.target.value)}
          />
          {!isClassified(f.category_id) && (
            <Field label="Condition">
              <select
                value={f.condition}
                onChange={(e) => update("condition", e.target.value)}
              >
                {["New", "Used", "Refurbished"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          )}
          <Field
            label="Location"
            required
            value={f.location}
            onChange={(e) => update("location", e.target.value)}
          />
          <Field
            label="Search keywords"
            placeholder="handwoven, cotton, kurta"
            value={f.tags}
            onChange={(e) => update("tags", e.target.value)}
          />
        </div>
        <details className="posting-accordion">
          <summary>Description, colour &amp; size <small>Optional</small></summary>
          <div className="posting-accordion-body">
        <Field label="Description (optional)">
          <textarea
            value={f.description}
            rows={4}
            maxLength={5000}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>
        <Field label="Colour (optional)" value={f.attributes?.Colour || ""} onChange={(e) => update("attributes", { ...f.attributes, Colour: e.target.value })} />
        {f.category_id === "fashion" && (
          <fieldset className="posting-sizes">
            <legend>Sizes (optional)</legend>
            <small>Select all that apply</small>
            <div>
              {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                <label key={size}>
                  <input
                    type="checkbox"
                    checked={(f.attributes?.Sizes || "").split(",").filter(Boolean).includes(size)}
                    onChange={(e) => {
                      const sizes = (f.attributes?.Sizes || "").split(",").filter(Boolean);
                      const next = e.target.checked ? [...sizes, size] : sizes.filter((s) => s !== size);
                      update("attributes", { ...f.attributes, Sizes: next.join(",") });
                    }}
                  /> {size}
                </label>
              ))}
            </div>
          </fieldset>
        )}
          </div>
        </details>
        <details className="posting-accordion" open={isClassified(f.category_id) || undefined} key={f.category_id}>
          <summary>{isClassified(f.category_id) ? "Category details" : "More category details"} <small>{isClassified(f.category_id) ? "Add the details buyers need" : "Optional"}</small></summary>
          <div className="posting-accordion-body">
        <div className="form-grid">
          {productFields(categories.find((c) => c.id === f.category_id)).map(
            (k) => (
              <Field
                key={k}
                label={
                  k +
                  (["Event starts", "Event ends"].includes(k)
                    ? " (India time)"
                    : "")
                }
              >
                {fieldOptions[k] ? (
                  <select
                    value={f.attributes?.[k] || ""}
                    onChange={(e) =>
                      update("attributes", {
                        ...f.attributes,
                        [k]: e.target.value,
                      })
                    }
                  >
                    <option value="">Choose / not specified</option>
                    {fieldOptions[k].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={
                      ["Year", "Registration year", "Kilometres"].includes(k)
                        ? "number"
                        : ["Event starts", "Event ends"].includes(k)
                          ? "datetime-local"
                          : [
                                "Application URL",
                                "Official notice URL",
                                "Booking URL",
                              ].includes(k)
                            ? "url"
                            : [
                                  "Insurance until",
                                  "Application deadline",
                                  "Available from",
                                ].includes(k)
                              ? "date"
                              : "text"
                    }
                    min={k === "Kilometres" ? 0 : 1886}
                    max={
                      k === "Kilometres"
                        ? 10000000
                        : new Date().getFullYear() + 1
                    }
                    step="1"
                    value={f.attributes?.[k] || ""}
                    onChange={(e) =>
                      update("attributes", {
                        ...f.attributes,
                        [k]: e.target.value,
                      })
                    }
                  />
                )}
              </Field>
            ),
          )}
        </div>
        <Field label="Your shop collection (optional)">
          <select value={f.collection_id || ""} onChange={(e) => update("collection_id", e.target.value)}>
            <option value="">No collection</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        {!isClassified(f.category_id) && (
          <InventoryEditor
            category={f.category_id}
            value={f.commerce}
            onChange={(v) => update("commerce", v)}
          />
        )}
        <Field label="SKU / your reference (optional)" value={f.sku || ""} onChange={(e) => update("sku", e.target.value)} />
        {initial && (
          <>
            <Field label="Listing state">
              <select value={f.status} onChange={(e) => update("status", e.target.value)}>
                {["published", "draft", "paused", "sold", "archived"].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <button className="button outline" type="submit" value="keep" disabled={busy || photoBusy || videoBusy}>Save listing state</button>
          </>
        )}
          </div>
        </details>
        <details className="posting-accordion">
          <summary>Video &amp; social posts <small>Optional</small></summary>
          <div className="posting-accordion-body">
        <ProductVideosEditor
          value={f.videos || []}
          onChange={(v) => update("videos", v)}
          onBusyChange={setVideoBusy}
          allowUpload={false}
        />
          <div className="social-editor">
            {["instagram", "facebook", "youtube"].map((k) => (
              <Field
                key={k}
                label={k + " post / video URL"}
                type="url"
                value={f.socials[k] || ""}
                onChange={(e) =>
                  update("socials", { ...f.socials, [k]: e.target.value })
                }
              />
            ))}
            <small>
              Add the exact post URL. Include its useful keywords in your
              product title or tags so people can find it.
            </small>
          </div>
          </div>
        </details>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="posting-actions">
          <button className="button primary full" type="submit" value="published" disabled={busy || photoBusy || videoBusy}>
            {busy ? "Saving…" : initial?.status === "published" ? "Save public changes" : "Post publicly"}
          </button>
          <button className="text-button" type="submit" value="draft" disabled={busy || photoBusy || videoBusy}>
            Save draft
          </button>
        </div>
      </form>
      {moderationAction}
    </Modal>
  );
}
export function Promotions({ seller, visual = false }) {
  const { notice } = useMarket();
  const [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [form, setForm] = useState({
      title: "",
      description: "",
      image: "",
      video_url: "",
      social_url: "",
      placement: "featured",
      destination: shopPath(seller.slug),
      starts_at: "",
      ends_at: "",
    });
  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const load = () => {
    if (!visual)
      result(
        supabase
          .from("campaigns")
          .select("*")
          .eq("seller_id", seller.id)
          .order("created_at", { ascending: false }),
      )
        .then(setRows)
        .catch((e) => setError(e.message));
  };
  useEffect(load, []);
  return (
    <>
      <h2>A little more spotlight</h2>
      <p>
        Request a featured homepage placement. Your campaign goes live only
        after payment and approval.
      </p>
      <form
        className="editor-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            if (visual)
              throw Error("Connect your account to submit a campaign.");
            if (form.video_url && !socialUrl(form.video_url))
              throw Error("Use a supported social video URL");
            if (form.social_url && !socialUrl(form.social_url))
              throw Error(
                "Use a supported Instagram, Facebook or YouTube post URL",
              );
            if (
              !(
                form.destination.startsWith("/") &&
                !form.destination.startsWith("//")
              ) &&
              !safeUrl(form.destination)
            )
              throw Error("Use a shop path or HTTPS destination");
            await result(
              supabase.from("campaigns").insert({
                ...form,
                seller_id: seller.id,
                starts_at: new Date(form.starts_at).toISOString(),
                ends_at: new Date(form.ends_at).toISOString(),
              }),
            );
            notice(
              "Campaign submitted. Admin will review placement and payment.",
            );
            load();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          label="Advertisement headline"
          required
          minLength={3}
          maxLength={100}
          value={form.title}
          onChange={(e) => change("title", e.target.value)}
        />
        <Field
          label="Short description"
          value={form.description}
          onChange={(e) => change("description", e.target.value)}
        />
        <h3>Advertisement cover</h3>
        <Upload value={form.image} onChange={(v) => change("image", v)} />
        <Field
          label="Video URL (optional)"
          type="url"
          value={form.video_url}
          onChange={(e) => change("video_url", e.target.value)}
        />
        <Field
          label="Instagram, Facebook or YouTube post URL (optional)"
          type="url"
          value={form.social_url}
          onChange={(e) => change("social_url", e.target.value)}
        />
        <Field label="Placement request">
          <select
            value={form.placement}
            onChange={(e) => change("placement", e.target.value)}
          >
            <option value="featured">Featured ads section</option>
            <option value="hero">Main hero carousel</option>
            <option value="both">Hero and featured ads</option>
          </select>
        </Field>
        <Field
          label="Where should this advertisement lead?"
          required
          value={form.destination}
          onChange={(e) => change("destination", e.target.value)}
        />
        <div className="form-grid">
          <Field
            label="Start (your local time)"
            type="datetime-local"
            required
            value={form.starts_at}
            onChange={(e) => change("starts_at", e.target.value)}
          />
          <Field
            label="End (your local time)"
            type="datetime-local"
            required
            min={form.starts_at}
            value={form.ends_at}
            onChange={(e) => change("ends_at", e.target.value)}
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary" disabled={busy}>
          Submit for review
        </button>
      </form>
      <h3>Your campaigns</h3>
      {rows.map((r) => (
        <div className="table-row" key={r.id}>
          <strong>{r.title}</strong>
          <span className="status">{r.status}</span>
          <span>{r.paid ? "Payment recorded" : "Awaiting payment"}</span>
        </div>
      ))}
    </>
  );
}
function Importer({ seller, visual }) {
  const { categories, notice, path } = useMarket();
  const requestedCategory = new URLSearchParams(path.split("?")[1]).get(
    "category",
  );
  const [rows, setRows] = useState([]),
    [log, setLog] = useState([]),
    [busy, setBusy] = useState(false),
    [fileName, setFileName] = useState("");
  const cancel = useRef(false);
  const template =
    "sku,title,category,subcategory,price,condition,location,images,social_url,tags,description,selling_mode,stock,variants_json,unit,delivery,video_urls,attributes_json\nTEE-001,Cotton T-shirt,fashion,t-shirts-tops,499,New,Imphal,https://example.com/photo.jpg,,cotton,Locally made,retail,10,,item,Collection or local delivery,,\n";
  const download = (text, name) => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <h2>Your catalogue, all together</h2>
      <p>
        Import a CSV with one row per product. Products are imported as drafts.
        Reusing an SKU updates that product instead of creating a duplicate.
        Optional stock, selling_mode, variants_json, video_urls and
        attributes_json columns carry product options. Use | between image or
        video URLs.
      </p>
      <button
        className="button outline"
        onClick={() =>
          download(template, "onlinekeithel-catalogue-template.csv")
        }
      >
        <DownloadSimple /> Download CSV template
      </button>
      <p>
        <a href="/category-reference.csv" download>
          Download default category and subcategory IDs (CSV)
        </a>
      </p>
      <Field label="Choose your catalogue CSV">
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files[0];
            if (!f) return;
            if (f.size > 15 * 1024 * 1024)
              return notice("Use a file smaller than 15 MB.");
            setFileName(f.name);
            Papa.parse(f, {
              header: true,
              skipEmptyLines: "greedy",
              complete: (r) => {
                if (r.errors.length)
                  return notice("CSV format error: " + r.errors[0].message);
                if (r.data.length > 15000)
                  return notice("Maximum 15,000 rows per batch");
                setRows(
                  r.data.map((row, i) => {
                    try {
                      return {
                        row: i + 2,
                        data: normalizeProductImport(row, seller, categories),
                      };
                    } catch (e) {
                      return { row: i + 2, error: e.message };
                    }
                  }),
                );
                setLog([]);
              },
            });
          }}
        />
      </Field>
      {rows.length > 0 && (
        <>
          <div className="notice-box">
            {fileName} · {rows.filter((r) => !r.error).length} valid rows ·{" "}
            {rows.filter((r) => r.error).length} errors
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Title</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 15).map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>{r.data?.title || "—"}</td>
                    <td>{r.error || "Ready as draft"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="button primary"
            disabled={busy || !rows.some((r) => !r.error)}
            onClick={async () => {
              if (visual)
                return notice("Import requires a connected seller account.");
              setBusy(true);
              cancel.current = false;
              const outcomes = rows
                .filter((r) => r.error)
                .map((r) => ({ row: r.row, result: r.error }));
              for (const row of rows.filter((r) => !r.error)) {
                if (cancel.current) break;
                try {
                  await result(
                    supabase
                      .from("listings")
                      .upsert(row.data, { onConflict: "seller_id,sku" }),
                  );
                  outcomes.push({ row: row.row, result: "Imported as draft" });
                } catch (e) {
                  outcomes.push({ row: row.row, result: e.message });
                }
                setLog([...outcomes]);
              }
              setBusy(false);
              notice(
                cancel.current
                  ? "Import paused. Re-upload this CSV to retry safely."
                  : "Import finished. Review results before publishing.",
              );
            }}
          >
            {busy
              ? `Importing… ${log.length}/${rows.length}`
              : "Import valid rows as drafts"}
          </button>
          {busy && (
            <button onClick={() => (cancel.current = true)}>
              Stop after current product
            </button>
          )}
        </>
      )}
      {log.length > 0 && (
        <>
          <p>
            {log.length} rows processed. Keep this page open while importing.
          </p>
          <button
            className="button outline"
            onClick={() => download(Papa.unparse(log), "import-results.csv")}
          >
            Download results
          </button>
        </>
      )}
      <p className="muted">
        Image URLs are linked rather than copied. Use image hosting you control.
        Imports run while this page is open; a server-side background importer
        is a later scale upgrade.
      </p>
    </>
  );
}
export function Dashboard({ startSell = false, visual = false }) {
  const {
    seller: realSeller,
    fixtures,
    session,
    navigate,
    path,
    plans,
    notice,
    admin,
    refreshUser,
  } = useMarket();
  const seller = visual ? fixtures?.sellers[0] : realSeller;
  const [tab, setTab] = useState(
      ["products", "profile", "collections", "import"].includes(new URLSearchParams(path.split("?")[1]).get("tab"))
        ? new URLSearchParams(path.split("?")[1]).get("tab")
        : "products",
    ),
    [rows, setRows] = useState([]),
    [collections, setCollections] = useState([]),
    [editing, setEditing] = useState(null),
    [duplicating, setDuplicating] = useState(null),
    [add, setAdd] = useState(false),
    [collectionName, setCollectionName] = useState(""),
    [collectionEdit, setCollectionEdit] = useState(null),
    [page, setPage] = useState(0),
    [more, setMore] = useState(false),
    [count, setCount] = useState(0);
  const load = async () => {
    if (!seller) return;
    if (visual) {
      setRows(fixtures.listings.filter((i) => i.seller_id === seller.id));
      setCount(2);
      return;
    }
    try {
      const [l, c, n] = await Promise.all([
        result(
          supabase
            .from("listings")
            .select("*")
            .eq("seller_id", seller.id)
            .order("created_at", { ascending: false })
            .range(page * 24, page * 24 + 24),
        ),
        result(
          supabase
            .from("collections")
            .select("*")
            .eq("seller_id", seller.id)
            .order("position"),
        ),
        supabase
          .from("listings")
          .select("*", { head: true, count: "exact" })
          .eq("seller_id", seller.id)
          .eq("status", "published"),
      ]);
      setRows(l.slice(0, 24));
      setMore(l.length > 24);
      setCollections(c);
      setCount(n.count || 0);
    } catch (e) {
      notice(e.message);
    }
  };
  useEffect(() => {
    load();
  }, [seller?.id, page, visual]);
  useEffect(() => {
    if (startSell && seller) setAdd(true);
  }, [startSell, seller?.id]);
  if (!seller)
    return (
      <div className="page narrow">
        <SellerForm onSaved={() => navigate("/dashboard")} />
      </div>
    );
  const limit = plans.find((p) => p.id === "free")?.listing_limit || 100;
  const tabs = [
    ["products", Package, "My products"],
    ["profile", Storefront, "Shop identity"],
    ["collections", Stack, "Collections"],
    ["import", UploadSimple, "Import catalogue"],
  ];
  return (
    <div className="page dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">YOUR LITTLE CORNER OF THE MARKET</span>
          <h1>{seller.name}</h1>
          <p>
            {seller.location} ·{" "}
            {seller.type === "shop" ? "Shop account" : "Individual seller"}
          </p>
        </div>
        <div className="shop-share-actions">
          <Link className="button outline" to={"/recruiter/" + seller.slug}>
            View recruiter page
          </Link>
          <Link className="button outline" to={shopPath(seller.slug)}>
            View storefront <ArrowSquareOut size={18} />
          </Link>
          <button
            type="button"
            className="button outline"
            onClick={async () => {
              const link = location.origin + shopPath(seller.slug);
              try {
                let copied = false;
                if (navigator.clipboard?.writeText) {
                  try {
                    await navigator.clipboard.writeText(link);
                    copied = true;
                  } catch {
                    /* Use the selection fallback below. */
                  }
                }
                if (!copied) {
                  const input = document.createElement("textarea");
                  input.value = link;
                  input.style.position = "fixed";
                  input.style.opacity = "0";
                  document.body.append(input);
                  input.select();
                  copied = document.execCommand("copy");
                  input.remove();
                  if (!copied) throw Error("Copy unavailable");
                }
                notice("Shop link copied");
              } catch {
                notice("Copy your link from the storefront address bar");
              }
            }}
          >
            <LinkSimple size={18} /> Copy shop link
          </button>
        </div>
      </div>
      {visual && (
        <div className="notice-box">
          Seller workspace preview. Changes cannot be published without a
          connected account.
        </div>
      )}
      <div className="dashboard-layout">
        <aside className="dashboard-menu">
          {tabs.map(([id, Icon, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <Icon size={21} />
              {label}
            </button>
          ))}
          {admin && (
            <Link to="/admin">
              <ShieldCheck size={20} /> Marketplace admin
            </Link>
          )}
          <div className="usage">
            <b>Your listings</b>
            <p>
              {count} / {limit.toLocaleString()} active products
            </p>
            <progress value={Math.min(count, limit)} max={limit} />
            <small>Your published ads stay visible until you pause them.</small>
          </div>
          {session && (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
            >
              <SignOut /> Sign out
            </button>
          )}
        </aside>
        <section className="dashboard-content">
          {tab === "products" && (
            <>
              <div className="section-heading">
                <div>
                  <h2>Your products</h2>
                  <p>Keep your good things looking their best.</p>
                </div>
                <button className="button primary" onClick={() => setAdd(true)}>
                  <Plus /> Add product
                </button>
              </div>
              {rows.length ? (
                <div className="inventory">
                  {rows.map((i) => (
                    <div className="inventory-row" key={i.id}>
                      <Photo src={i.images?.[0]} alt={i.title} />
                      <div>
                        <strong>{i.title}</strong>
                        <small>
                          {money(i.price)} · {i.category_id}
                        </small>
                      </div>
                      <span className={"status " + i.status}>
                        {i.status === "published" && (!entitlement || new Date(entitlement.expires_at) <= new Date())
                          && i.published_at && new Date(i.published_at) < new Date(Date.now() - 14 * 86400000)
                          ? "Expired · edit to renew" : i.status}
                      </span>
                      <button
                        className="icon-button"
                        aria-label={"Duplicate " + i.title}
                        title="Duplicate this ad"
                        onClick={() => setDuplicating(i)}
                      >
                        <CopySimple size={20} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={"Edit " + i.title}
                        onClick={() => setEditing(i)}
                      >
                        <PencilSimple size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty title="Your first product starts here">
                  Add photos, a price and a little detail. We’ll give it a home.
                </Empty>
              )}
              <div className="pagination">
                <button disabled={!page} onClick={() => setPage(page - 1)}>
                  Previous
                </button>
                <span>Page {page + 1}</span>
                <button disabled={!more} onClick={() => setPage(page + 1)}>
                  Next
                </button>
              </div>
            </>
          )}
          {tab === "profile" && (
            <SellerForm
              key={seller.id}
              existing={seller}
              onSaved={refreshUser}
            />
          )}{" "}
          {tab === "collections" && (
            <>
              <h2>Make room for everything</h2>
              <p>
                Collections organise products inside your shop. Marketplace
                categories stay the same.
              </p>
              <form
                className="inline-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    if (visual)
                      throw Error("Connect your account to save collections.");
                    await result(
                      collectionEdit
                        ? supabase
                            .from("collections")
                            .update({ name: collectionName })
                            .eq("id", collectionEdit)
                        : supabase.from("collections").insert({
                            seller_id: seller.id,
                            name: collectionName,
                            position: collections.length,
                          }),
                    );
                    setCollectionName("");
                    setCollectionEdit(null);
                    load();
                  } catch (e) {
                    notice(e.message);
                  }
                }}
              >
                <Field
                  label="Collection name"
                  required
                  maxLength={60}
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g. New arrivals"
                />
                <button className="button primary">
                  {collectionEdit ? "Save" : "Add collection"}
                </button>
              </form>
              {collections.map((c) => (
                <div className="table-row" key={c.id}>
                  <strong>{c.name}</strong>
                  <button
                    aria-label={"Edit " + c.name}
                    onClick={() => {
                      setCollectionEdit(c.id);
                      setCollectionName(c.name);
                    }}
                  >
                    <PencilSimple />
                  </button>
                  <button
                    aria-label={"Delete " + c.name}
                    onClick={async () => {
                      try {
                        await result(
                          supabase
                            .from("listings")
                            .update({ collection_id: null })
                            .eq("collection_id", c.id),
                        );
                        await result(
                          supabase.from("collections").delete().eq("id", c.id),
                        );
                        load();
                      } catch (e) {
                        notice(e.message);
                      }
                    }}
                  >
                    <Trash />
                  </button>
                </div>
              ))}
            </>
          )}
          {tab === "import" && <Importer seller={seller} visual={visual} />}{" "}
        </section>
      </div>
      {(add || editing || duplicating) && (
        <ListingEditor
          visual={visual}
          seller={seller}
          initial={editing}
          duplicateFrom={duplicating}
          existingListings={rows}
          collections={collections}
          onClose={() => {
            setAdd(false);
            setEditing(null);
            setDuplicating(null);
          }}
          onSaved={load}
        />
      )}
    </div>
  );
}

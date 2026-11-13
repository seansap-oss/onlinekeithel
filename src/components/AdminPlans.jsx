import React, { useEffect, useState } from "react";
import { useMarket } from "../lib/context";
import { result, supabase } from "../lib/backend";

export function AdminPlans({ visual = false }) {
  const { settings, plans, refresh, notice } = useMarket();
  const [sellers, setSellers] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [busy, setBusy] = useState("");
  useEffect(() => {
    if (visual) return;
    Promise.all([
      result(supabase.from("sellers").select("id,name").order("name").limit(100)),
      result(supabase.from("entitlements").select("seller_id,plan_id,expires_at")),
    ]).then(([s, e]) => { setSellers(s); setEntitlements(e); }).catch((e) => notice(e.message));
  }, [visual]);
  const updatePlanFeature = async (plan, field, enabled) => {
    setBusy(plan.id);
    try {
      await result(supabase.from("plans").update({ [field]: enabled }).eq("id", plan.id).select("id").single());
      await refresh();
      notice("Plan feature updated.");
    } catch (e) { notice(e.message); }
    finally { setBusy(""); }
  };
  const assign = async (seller, planId) => {
    setBusy(seller.id);
    try {
      if (planId === "free") {
        await result(supabase.from("entitlements").delete().eq("seller_id", seller.id));
        setEntitlements((rows) => rows.filter((row) => row.seller_id !== seller.id));
      } else {
        const plan = plans.find((entry) => entry.id === planId);
        const row = await result(supabase.from("entitlements").upsert({
          seller_id: seller.id, plan_id: plan.id, listing_limit: plan.listing_limit,
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        }, { onConflict: "seller_id" }).select("seller_id,plan_id,expires_at").single());
        setEntitlements((rows) => [...rows.filter((entry) => entry.seller_id !== seller.id), row]);
      }
      notice("Store plan updated.");
    } catch (e) { notice(e.message); }
    finally { setBusy(""); }
  };
  const setEnforcement = async () => {
    setBusy("enforcement");
    try {
      const current = await result(supabase.from("settings").select("value").eq("id", "marketplace").single());
      await result(supabase.rpc("publish_homepage", {
        p_value: { ...current.value, premium_enforcement: !current.value.premium_enforcement },
        p_expected: current.value,
      }));
      await refresh();
      notice("Premium access setting saved.");
    } catch (e) { notice(e.message); }
    finally { setBusy(""); }
  };
  return <div className="admin-plan-access">
    <h2>Plans & entitlements</h2>
    <p className="muted">Manage notification access. During launch, premium enforcement is off and all stores can enable available features.</p>
    <label className="admin-plan-switch"><span><strong>Premium enforcement</strong><small>When on, plan features restrict email and WhatsApp alerts.</small></span><input type="checkbox" disabled={visual || !!busy} checked={settings.premium_enforcement === true} onChange={setEnforcement} /></label>
    <h3>Features by plan</h3>
    {plans.map((plan) => <div className="admin-plan-row" key={plan.id}>
      <strong>{plan.name}</strong>
      <label><input type="checkbox" disabled={visual || !!busy} checked={plan.email_alerts === true} onChange={(e) => updatePlanFeature(plan, "email_alerts", e.target.checked)} /> Email copies</label>
      <label><input type="checkbox" disabled={visual || !!busy} checked={plan.whatsapp_alerts === true} onChange={(e) => updatePlanFeature(plan, "whatsapp_alerts", e.target.checked)} /> WhatsApp alerts</label>
    </div>)}
    <h3>Store plans</h3>
    {sellers.map((seller) => {
      const entitlement = entitlements.find((entry) => entry.seller_id === seller.id && new Date(entry.expires_at) > new Date());
      return <label className="admin-plan-row" key={seller.id}><strong>{seller.name}</strong><select aria-label={"Plan for " + seller.name} disabled={visual || !!busy} value={entitlement?.plan_id || "free"} onChange={(e) => assign(seller, e.target.value)}><option value="free">Basic / free</option>{plans.filter((plan) => plan.id !== "free").map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select>{entitlement && <small>Until {new Date(entitlement.expires_at).toLocaleDateString()}</small>}</label>;
    })}
    <p className="muted">Verified payments already create entitlements through the payment webhook. Manual plan changes here are administrator actions.</p>
  </div>;
}

import { db } from "./_lib/server.js";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

async function claim(client, messageId, channel) {
  const { error } = await client.from("store_notification_receipts").insert({ message_id: messageId, channel });
  if (error?.code === "23505") return false;
  if (error) throw error;
  return true;
}
async function deliver(client, messageId, channel, send) {
  if (!await claim(client, messageId, channel)) return;
  try { await send(); }
  catch (error) {
    await client.from("store_notification_receipts").delete().eq("message_id", messageId).eq("channel", channel);
    throw error;
  }
}
export async function POST(request) {
  try {
    if (Number(request.headers.get("content-length")) > 2048) return Response.json({ error: "Request too large" }, { status: 413 });
    const client = db();
    const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
    const { data: auth, error: authError } = await client.auth.getUser(token);
    if (authError || !auth.user) return Response.json({ error: "Sign in required" }, { status: 401 });
    const { messageId } = await request.json();
    if (!/^[a-f0-9-]{36}$/i.test(messageId || "")) return Response.json({ error: "Invalid message" }, { status: 400 });
    const { data: message, error } = await client.from("store_messages").select("id,body,sender_id,conversation:store_conversations(buyer_id,seller:sellers(id,name,user_id,notify_email,notify_whatsapp,messages_enabled))").eq("id", messageId).single();
    if (error || !message || message.sender_id !== auth.user.id || message.conversation.buyer_id !== auth.user.id)
      return Response.json({ error: "Message unavailable" }, { status: 403 });
    const seller = message.conversation.seller;
    if (!seller.messages_enabled) return Response.json({ queued: false });
    const { data: setting } = await client.from("settings").select("value").eq("id", "marketplace").single();
    const { data: entitlement } = await client.from("entitlements").select("plan_id,expires_at").eq("seller_id", seller.id).maybeSingle();
    const planId = entitlement && new Date(entitlement.expires_at) > new Date() ? entitlement.plan_id : "free";
    const { data: plan } = await client.from("plans").select("email_alerts,whatsapp_alerts").eq("id", planId).maybeSingle();
    const allowEmail = setting?.value?.premium_enforcement !== true || plan?.email_alerts === true;
    const allowWhatsApp = setting?.value?.premium_enforcement !== true || plan?.whatsapp_alerts === true;
    const sent = [];
    if (seller.notify_email && allowEmail && process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL) {
      const { data: owner, error: ownerError } = await client.auth.admin.getUserById(seller.user_id);
      if (ownerError) throw ownerError;
      if (owner.user?.email && owner.user.email_confirmed_at) {
        await deliver(client, message.id, "email", async () => {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `store-${message.id}-email` },
            body: JSON.stringify({
              from: process.env.NOTIFICATION_FROM_EMAIL,
              to: [owner.user.email],
              subject: `New store message on OnlineKeithel · ${seller.name}`,
              html: `<p>You have a new message for ${escapeHtml(seller.name)}:</p><blockquote>${escapeHtml(message.body).replace(/\n/g, "<br>")}</blockquote><p>Open your OnlineKeithel Messages inbox to reply.</p>`,
            }),
          });
          if (!response.ok) throw Error("Email provider rejected the alert");
        });
        sent.push("email");
      }
    }
    if (seller.notify_whatsapp && allowWhatsApp && process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TEMPLATE_NAME) {
      const { data: contact } = await client.from("seller_private_contacts").select("whatsapp").eq("seller_id", seller.id).maybeSingle();
      if (contact?.whatsapp) {
        await deliver(client, message.id, "whatsapp", async () => {
          const version = process.env.WHATSAPP_GRAPH_VERSION || "v27.0";
          const response = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ messaging_product: "whatsapp", to: contact.whatsapp, type: "template", template: { name: process.env.WHATSAPP_TEMPLATE_NAME, language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US" } } }),
          });
          if (!response.ok) throw Error("WhatsApp provider rejected the alert");
        });
        sent.push("whatsapp");
      }
    }
    return Response.json({ delivered: sent });
  } catch {
    // The message is already safely stored in the in-app inbox.
    return Response.json({ error: "External notification unavailable" }, { status: 503 });
  }
}

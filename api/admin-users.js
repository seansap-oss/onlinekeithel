import { db, fail } from "./_lib/server.js";
export async function requireAdmin(req, client) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!token) throw Object.assign(Error("Sign in required"), { status: 401 });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user)
    throw Object.assign(Error("Sign in required"), { status: 401 });
  const membership = await client
    .from("admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (membership.error || !membership.data)
    throw Object.assign(Error("Administrator access required"), {
      status: 403,
    });
  return data.user;
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method))
    return res.status(405).json({ error: "Method not allowed" });
  try {
    const client = db();
    await requireAdmin(req, client);
    if (req.method === "GET") {
      const page = Math.max(
        1,
        Math.min(10000, Number.parseInt(req.query?.page, 10) || 1),
      );
      const { data, error } = await client.auth.admin.listUsers({
        page,
        perPage: 30,
      });
      if (error) throw error;
      return res
        .status(200)
        .json({
          users: data.users.map((u) => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            confirmed: !!u.email_confirmed_at,
            last_sign_in_at: u.last_sign_in_at,
          })),
          more: data.users.length === 30,
        });
    }
    const email = String(req.body?.email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      return res.status(400).json({ error: "Enter a valid email address" });
    const { error } = await client.auth.admin.inviteUserByEmail(email);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (e) {
    return fail(res, e);
  }
}

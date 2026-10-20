import React, { useEffect, useState } from "react";
import { useMarket } from "../lib/context";
import { Field } from "./UI";
export function AdminUsers({ visual = false }) {
  const { session, notice } = useMarket();
  const [users, setUsers] = useState([]),
    [page, setPage] = useState(1),
    [more, setMore] = useState(false),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false);
  const request = async (method = "GET") => {
    if (visual)
      throw Error(
        "User management requires a connected administrator account.",
      );
    const res = await fetch("/api/admin-users?page=" + page, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session.access_token,
      },
      ...(method === "POST" ? { body: JSON.stringify({ email }) } : {}),
    });
    const data = await res.json();
    if (!res.ok) throw Error(data.error || "Unable to load users");
    return data;
  };
  const load = async () => {
    if (visual) return;
    try {
      const data = await request();
      setUsers(data.users);
      setMore(data.more);
    } catch (e) {
      notice(e.message);
    }
  };
  useEffect(() => {
    load();
  }, [page]);
  return (
    <section>
      <h2>Users</h2>
      <p>
        Invite a person to create their account. They choose their own password
        through the secure email link.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await request("POST");
            setEmail("");
            notice("Invitation sent");
            load();
          } catch (e) {
            notice(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          label="Email address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="button primary" disabled={busy}>
          {busy ? "Sending…" : "Send invitation"}
        </button>
      </form>
      <div className="admin-list">
        {users.map((u) => (
          <div className="admin-row" key={u.id}>
            <div>
              <strong>{u.email}</strong>
              <small>
                {u.confirmed ? "Email confirmed" : "Awaiting confirmation"} ·
                Joined {new Date(u.created_at).toLocaleDateString()}
              </small>
            </div>
          </div>
        ))}
      </div>
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>Page {page}</span>
        <button disabled={!more} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </section>
  );
}

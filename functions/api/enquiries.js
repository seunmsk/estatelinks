// GET /api/enquiries -> the admin inbox; PUT replaces it after status changes or deletes. Both need the admin password.
import { json, authed } from "../../lib/util.js";

export async function onRequestGet({ request, env }) {
  if (!authed(request, env)) return json({ error: "Not authorised" }, 401);
  return json((await env.CONTENT.get("enquiries", "json")) || []);
}

export async function onRequestPut({ request, env }) {
  if (!authed(request, env)) return json({ error: "Not authorised" }, 401);
  let list;
  try { list = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!Array.isArray(list)) return json({ error: "Expected a list" }, 400);
  await env.CONTENT.put("enquiries", JSON.stringify(list.slice(0, 1000)));
  return json({ ok: true });
}

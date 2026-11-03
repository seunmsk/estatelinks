// GET  /api/content  -> the website's editable content (listings, team, projects, FAQs, settings)
// PUT  /api/content  -> save content from the admin (needs the admin password)
import { json, authed } from "../../lib/util.js";

export async function onRequestGet({ env }) {
  const content = await env.CONTENT.get("content", "json");
  return json(content || {});
}

export async function onRequestPut({ request, env }) {
  if (!authed(request, env)) return json({ error: "Not authorised" }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!body || !Array.isArray(body.listings)) return json({ error: "Content must include listings" }, 400);
  const previous = await env.CONTENT.get("content");
  if (previous) await env.CONTENT.put(`backup:${new Date().toISOString()}`, previous, { expirationTtl: 60 * 60 * 24 * 30 });
  await env.CONTENT.put("content", JSON.stringify(body));
  return json({ ok: true, savedAt: new Date().toISOString() });
}

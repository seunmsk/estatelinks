// POST /api/enquiry -> public endpoint for the website's forms (request, viewing, video tour).
// Saves to the admin inbox and, if RESEND_API_KEY and NOTIFY_EMAIL are set, emails the team.
import { json, clip } from "../../lib/util.js";

export async function onRequestPost({ request, env, waitUntil }) {
  let e;
  try { e = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!e || (!e.name && !e.phone)) return json({ error: "Add a name or phone number" }, 400);
  if (e.website) return json({ ok: true }); // honeypot field: bots fill it, people never see it

  const details = {};
  if (e.details && typeof e.details === "object")
    Object.entries(e.details).slice(0, 20).forEach(([k, v]) => { details[clip(k, 40)] = clip(v, 300); });

  const item = {
    id: clip(e.id, 40) || `q${Date.now().toString(36)}`,
    at: new Date().toISOString(),
    status: "New",
    type: clip(e.type, 40) || "Enquiry",
    ref: clip(e.ref, 40), service: clip(e.service, 120),
    name: clip(e.name, 120), phone: clip(e.phone, 40), email: clip(e.email, 160), notes: clip(e.notes, 2000),
    listing: clip(e.listing, 120), title: clip(e.title, 200), details,
  };

  const list = (await env.CONTENT.get("enquiries", "json")) || [];
  list.unshift(item);
  await env.CONTENT.put("enquiries", JSON.stringify(list.slice(0, 1000)));

  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    const lines = [
      `${item.type}${item.service ? ` · ${item.service}` : ""}${item.title ? ` · ${item.title}` : ""}`,
      `Name: ${item.name}`, `Phone: ${item.phone}`, item.email && `Email: ${item.email}`,
      ...Object.entries(details).map(([k, v]) => `${k}: ${v}`), item.notes && `Notes: ${item.notes}`,
    ].filter(Boolean);
    const send = fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.NOTIFY_FROM || "Estate Links website <onboarding@resend.dev>", to: env.NOTIFY_EMAIL.split(","), subject: `New ${item.type.toLowerCase()} from ${item.name || item.phone}`, text: lines.join("\n") }),
    }).catch(() => {});
    if (waitUntil) waitUntil(send);
  }
  return json({ ok: true, id: item.id });
}

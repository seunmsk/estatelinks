// POST /api/upload -> store a photo in R2 and return its public URL (needs the admin password)
import { json, authed, notReady } from "../../lib/util.js";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function onRequestPost({ request, env }) {
  if (!env.MEDIA) return notReady();
  if (!authed(request, env)) return json({ error: "Not authorised" }, 401);
  const type = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!TYPES[type]) return json({ error: "Upload a JPEG, PNG or WebP image" }, 415);
  const body = await request.arrayBuffer();
  if (body.byteLength > 8 * 1024 * 1024) return json({ error: "Image is larger than 8 MB" }, 413);
  const key = `uploads/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${TYPES[type]}`;
  await env.MEDIA.put(key, body, { httpMetadata: { contentType: type } });
  return json({ url: `/media/${key}` });
}

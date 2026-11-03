// GET /api/status -> shows whether storage and the admin password are connected (no secrets are revealed)
export async function onRequestGet({ env }) {
  const s = { contentStore: !!env.CONTENT, photoStore: !!env.MEDIA, adminPassword: !!env.ADMIN_PASSWORD };
  s.mode = s.contentStore && s.adminPassword ? "live" : "preview";
  s.missing = [!s.contentStore && "KV binding named CONTENT", !s.adminPassword && "secret named ADMIN_PASSWORD"].filter(Boolean);
  return new Response(JSON.stringify(s, null, 2), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

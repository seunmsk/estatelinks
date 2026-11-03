// GET /media/<key> -> serve an uploaded photo from R2 with long-lived caching
export async function onRequestGet({ params, env }) {
  const key = [].concat(params.path || []).join("/");
  if (!key) return new Response("Not found", { status: 404 });
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}

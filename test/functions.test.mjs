// Runs the Pages Functions against in-memory KV and R2 stand-ins. `npm test`
import assert from "node:assert/strict";
import * as content from "../functions/api/content.js";
import * as upload from "../functions/api/upload.js";
import * as enquiry from "../functions/api/enquiry.js";
import * as enquiries from "../functions/api/enquiries.js";
import * as media from "../functions/media/[[path]].js";

const kvStore = new Map(), r2Store = new Map();
const env = {
  ADMIN_PASSWORD: "s3cret-pass",
  CONTENT: { async get(k, t) { const v = kvStore.get(k); return v == null ? null : t === "json" ? JSON.parse(v) : v; }, async put(k, v) { kvStore.set(k, v); } },
  MEDIA: {
    async put(k, body, o) { r2Store.set(k, { body: new Uint8Array(body), type: o.httpMetadata.contentType }); },
    async get(k) { const o = r2Store.get(k); if (!o) return null; return { body: o.body, httpEtag: '"x"', writeHttpMetadata: h => h.set("content-type", o.type) }; },
  },
};
const req = (method, body, headers = {}) => new Request("https://x.test/", { method, body, headers });
const auth = { authorization: "Bearer s3cret-pass" };

let r = await content.onRequestGet({ env });
assert.equal(r.headers.get("x-el-api"), "1"); assert.deepEqual(await r.json(), {});
r = await content.onRequestPut({ env, request: req("PUT", JSON.stringify({ listings: [] }), { authorization: "Bearer wrong" }) });
assert.equal(r.status, 401);
r = await content.onRequestPut({ env, request: req("PUT", JSON.stringify({ listings: [{ id: "a" }] }), auth) });
assert.equal(r.status, 200);
assert.deepEqual((await (await content.onRequestGet({ env })).json()).listings, [{ id: "a" }]);
await content.onRequestPut({ env, request: req("PUT", JSON.stringify({ listings: [{ id: "b" }] }), auth) });
assert.ok([...kvStore.keys()].some(k => k.startsWith("backup:")), "previous content is backed up");

r = await upload.onRequestPost({ env, request: req("POST", new Uint8Array([1, 2, 3]), { ...auth, "content-type": "image/jpeg" }) });
const { url } = await r.json(); assert.match(url, /^\/media\/uploads\/.+\.jpg$/);
r = await upload.onRequestPost({ env, request: req("POST", "x", { ...auth, "content-type": "text/plain" }) });
assert.equal(r.status, 415);
r = await media.onRequestGet({ env, params: { path: url.replace("/media/", "").split("/") } });
assert.equal(r.status, 200); assert.equal(r.headers.get("content-type"), "image/jpeg");

r = await enquiry.onRequestPost({ env, request: req("POST", JSON.stringify({ type: "Viewing", name: "Ada", phone: "0803", details: { date: "2026-11-10" } })) });
assert.equal(r.status, 200);
r = await enquiry.onRequestPost({ env, request: req("POST", JSON.stringify({ type: "x" })) });
assert.equal(r.status, 400);
r = await enquiries.onRequestGet({ env, request: req("GET") });
assert.equal(r.status, 401);
const list = await (await enquiries.onRequestGet({ env, request: req("GET", null, auth) })).json();
assert.equal(list.length, 1); assert.equal(list[0].name, "Ada"); assert.equal(list[0].status, "New");
list[0].status = "Contacted";
await enquiries.onRequestPut({ env, request: req("PUT", JSON.stringify(list), auth) });
assert.equal((await (await enquiries.onRequestGet({ env, request: req("GET", null, auth) })).json())[0].status, "Contacted");
console.log("All function tests passed");

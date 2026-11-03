# Estate Links website

The Estate Links website runs on Cloudflare Pages, with a built-in admin at **/#admin**.

- **Website:** `index.html` at the top of the repo, plus the logo and the `img/` photos. It needs no build step.
- **Admin:** staff edit listings, photos, the team, projects, FAQs, homepage text, contact details and exchange rates, and read enquiries.
- **Storage:** content and enquiries are saved in Cloudflare KV, and uploaded photos in Cloudflare R2.
- **Cost:** on Cloudflare's free tiers it is ₦0 a month for a site this size. The only yearly cost is the estatelinks.net domain itself.

## Go live

The Pages project is already connected to this repository, and every push redeploys it. Until the storage below is connected, the site runs in preview mode: everything works, but admin changes only save in the browser that made them.

1. **Create the storage** (Cloudflare dashboard):
   - **Storage & Databases → KV → Create**, and name it `estatelinks-content`.
   - **R2 → Create bucket**, and name it `estatelinks-media`. R2 asks you to enable it once; the first 10 GB are free.
2. **Connect the storage to the site.** Open **Workers & Pages → estatelinks → Settings → Bindings → Add** and add both of these:
   - **KV namespace:** variable name `CONTENT`, namespace `estatelinks-content`.
   - **R2 bucket:** variable name `MEDIA`, bucket `estatelinks-media`.
3. **Set the admin password.** Under **Settings → Variables and Secrets**, add a variable named `ADMIN_PASSWORD`, choose the **Secret** type and use a long password.
4. **Redeploy.** Under **Deployments**, open the latest one and choose **Retry deployment**. Bindings only take effect on a new deployment.
5. **Check it.** Open `/#admin` on the site. The sidebar should say **Live**, and the preview banner at the top should be gone.
6. **Optional: get enquiries by email.** Add the secrets `RESEND_API_KEY` (from resend.com) and `NOTIFY_EMAIL`, then redeploy.
7. **Connect the domain.** Under **Custom domains**, add `estatelinks.net` and `www.estatelinks.net`, then follow the nameserver instructions.
8. **Bring over preview edits.** In the preview's admin, open **Backup & go live** and copy the content. Paste it into the same tab in the live admin and click **Load this content**.

Pages settings: framework preset **None**, with the build command and build output directory both left empty.

## Work on it locally

```
cp .dev.vars.example .dev.vars   # set ADMIN_PASSWORD
npm install
npm run dev                      # http://localhost:8788 with local KV and R2 · admin at /#admin
npm test                         # checks the API functions
```

## How it fits together

| Path | What it does |
|---|---|
| `index.html` | The whole website and admin |
| `functions/api/content.js` | `GET` returns site content; `PUT` saves it (admin only). Each save keeps a 30-day backup of the previous version in KV. |
| `functions/api/upload.js` | `POST` stores a photo in R2 (admin only) |
| `functions/media/[[path]].js` | Serves uploaded photos with long caching |
| `functions/api/enquiry.js` | `POST` from the website's forms; saves to the inbox and optionally emails |
| `functions/api/enquiries.js` | The admin inbox: read and update (admin only) |

The page detects the API by itself. Opened anywhere else, such as in a preview, it falls back to saving in the visitor's browser and the admin password is `admin`.

To change the website's design or code, edit `index.html` directly. Day-to-day content changes belong in the admin.

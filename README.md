# Estate Links website

The Estate Links website runs on Cloudflare Pages, with a built-in admin at **/#admin**.

- **Website:** `public/` holds one page plus the logo and photos. It needs no build step.
- **Admin:** staff edit listings, photos, the team, projects, FAQs, homepage text, contact details and exchange rates, and read enquiries.
- **Storage:** content and enquiries are saved in Cloudflare KV, and uploaded photos in Cloudflare R2.
- **Cost:** on Cloudflare's free tiers it is ₦0 a month for a site this size. The only yearly cost is the estatelinks.net domain itself.

## Go live (about 30 minutes)

1. **Put the code on GitHub.** Create a private repository (for example `estatelinks-site`) and push this folder to it.
2. **Create the storage.** Make a Cloudflare account, then run these from this folder:
   ```
   npm install
   npx wrangler login
   npx wrangler kv namespace create estatelinks-content
   npx wrangler r2 bucket create estatelinks-media
   ```
   The KV command prints an `id`. Paste it into `wrangler.toml` in place of `REPLACE_WITH_KV_NAMESPACE_ID`, then commit and push. R2 asks you to enable it once in the dashboard; the first 10 GB are free.
3. **Create the Pages project.** In the Cloudflare dashboard go to **Workers & Pages → Create → Pages → Connect to Git** and pick the repository.
   - Build command: *(leave empty)*
   - Build output directory: `public`
4. **Set the admin password.** Go to the project's **Settings → Variables and Secrets** and add a **Secret** named `ADMIN_PASSWORD`. Use a long password, then redeploy.
5. **Optional: get enquiries by email.** Add the secrets `RESEND_API_KEY` (from resend.com, which has a free tier) and `NOTIFY_EMAIL` (for example `info@estatelinks.net`). Every new enquiry is then emailed as well as saved in the admin.
6. **Connect the domain.** Under the project's **Custom domains**, add `estatelinks.net` and `www.estatelinks.net`. Cloudflare shows the nameservers to set at the current domain registrar. You can also transfer the domain to Cloudflare Registrar, which charges cost price.
7. **Bring over preview edits.** If you edited content in the preview, open **Admin → Backup & go live** there and copy the content. Then log in to the live admin, open the same tab, paste it in and click **Load this content**.

Once you've done this, every push to GitHub redeploys the site automatically. Admin edits publish instantly and don't need a redeploy.

## Work on it locally

```
cp .dev.vars.example .dev.vars   # set ADMIN_PASSWORD
npm install
npm run dev                      # http://localhost:8788  ·  admin at /#admin
npm test                         # checks the API functions
```

## How it fits together

| Path | What it does |
|---|---|
| `public/index.html` | The whole website and admin |
| `functions/api/content.js` | `GET` returns site content; `PUT` saves it (admin only). Each save keeps a 30-day backup of the previous version in KV. |
| `functions/api/upload.js` | `POST` stores a photo in R2 (admin only) |
| `functions/media/[[path]].js` | Serves uploaded photos with long caching |
| `functions/api/enquiry.js` | `POST` from the website's forms; saves to the inbox and optionally emails |
| `functions/api/enquiries.js` | The admin inbox: read and update (admin only) |

The page detects the API by itself. Opened anywhere else, such as in a preview, it falls back to saving in the visitor's browser and the admin password is `admin`.

To change the website's design or code, edit `public/index.html` directly. Day-to-day content changes belong in the admin.

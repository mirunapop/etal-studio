# Et al. Studio: etal.studio

The website of Et al. Studio, a one-person studio that builds websites for funded research projects, consortia and labs in the Netherlands.

A plain static site: no framework, no build step, no cookies, no third-party requests. GitHub Pages serves it straight from the repo root on `main`.

```
index.html                 studio homepage
specimens/                 overview + three invented demo projects (cloak, halocline, source-code), all noindex
supplier-details/          KvK, VAT, address, payment terms for finance offices (hidden until the Monday release)
privacy/                   draft privacy page
404.html                   not-found page (uses root-absolute paths, because it is served from any URL)
assets/                    site.css, site.js, cells.js, fonts.css, fonts-grotesk.css, fonts/ (self-hosted woff2)
tools/                     dev-only scripts: release.py, copy-fonts.mjs, render-images.mjs + image templates
CNAME, robots.txt, sitemap.xml, favicon.svg, apple-touch-icon.png, og-image.png
```

## Preview locally

```bash
python3 -m http.server
```

Then open <http://localhost:8000>. Python's server does not use `404.html`; it only appears on GitHub Pages. To look at it locally, open <http://localhost:8000/404.html>.

## Deploy to GitHub Pages

Do these in order.

1. **Publish from `main`.** Repo → Settings → Pages → Build and deployment → Source: *Deploy from a branch*, Branch: `main`, folder: `/ (root)`.
2. **Add the custom domain in GitHub first, before touching DNS.** Settings → Pages → Custom domain → `etal.studio` → Save. The `CNAME` file in this repo already contains it, so it survives deploys.
3. **DNS at the registrar.**
   - Four `A` records for the apex `etal.studio`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - One `CNAME` record: host `www`, value `mirunapop.github.io`.
4. **Verify the domain with a TXT record.** GitHub account → Settings → Pages → Add a domain → `etal.studio`. GitHub shows a TXT record (host `_github-pages-challenge-mirunapop`, plus a value). Add it at the registrar and click Verify. This stops anyone else claiming the domain on GitHub Pages. It can be done any time, and the earlier the better.
5. **Enforce HTTPS.** Once Settings → Pages shows that DNS check passed, tick *Enforce HTTPS*. GitHub has to issue the certificate first, so the box can be greyed out for a while after DNS changes.

After step 5, open <https://etal.studio/>, <https://www.etal.studio/> (should redirect) and a bogus URL like <https://etal.studio/nope> (should show the 404 page).

## Monday release checklist

Until the KvK registration is done, everything with company details is **hidden**, not deleted. Every such element has `hidden data-release="company-info"`. Find them all with:

```bash
grep -rn 'data-release' --include='*.html' .
```

### The easy way: one command

When you have the KvK number, VAT ID (btw-id) and business address:

```bash
python3 tools/release.py --kvk 12345678 --vat NL123456789B01 --address "Street 1, 1000 AA Amsterdam"
```

Add `--dry-run` first if you want to see what it will change. The script checks the formats (KvK: 8 digits; VAT: `NL` + 9 digits + `B` + 2 digits), then in every HTML file it:

1. fills the three values into the placeholders (`data-fill="kvk|vat|address"`),
2. removes `hidden data-release="company-info"` from every hidden element,
3. removes the `noindex` meta tag from `supplier-details/index.html`,

and exits with an error if any marker is left over.

Then:

- [ ] Preview locally (`python3 -m http.server`) and look at the footer and `/supplier-details/`.
- [ ] Optional: add `/supplier-details/` to `sitemap.xml` (it is left out on purpose until now).
- [ ] `grep -rn 'data-release\|data-fill' --include='*.html' .` should print nothing.
- [ ] Commit and push.

### What it changes, spot by spot (the manual way)

If you would rather edit by hand, this is every spot. In each: replace the placeholder text inside `<span class="todo" data-fill="...">…</span>` with the real value (and delete the span, keeping the text), and delete ` hidden data-release="company-info"` from the tag.

| File | Spot | Fill in |
|---|---|---|
| `index.html` | footer: KvK, btw-id, Address, "Supplier details" link | KvK, VAT ID, address |
| `index.html` | Budget section: "Supplier details for your finance office →" link (`.finlink`) | only unhide |
| `specimens/index.html` | footer: same four items | KvK, VAT ID, address |
| `privacy/index.html` | footer: same four items | KvK, VAT ID, address |
| `404.html` | footer: same four items | KvK, VAT ID, address |
| `supplier-details/index.html` | footer: same four items | KvK, VAT ID, address |
| `supplier-details/index.html` | table rows **KvK**, **VAT ID**, **Address** | KvK, VAT ID, address |
| `supplier-details/index.html` | `<meta name="robots" content="noindex" data-release="company-info">` in `<head>` | delete the whole line |

The three specimen pages (`specimens/cloak`, `halocline`, `source-code`) have no company details. Their `noindex` is permanent, so leave it.

## Regenerating generated files

Needs Node. Everything lives in `tools/`; `node_modules` is git-ignored.

```bash
cd tools
npm install
npm run fonts     # copies the latin woff2 files we use from @fontsource into assets/fonts/ and rewrites assets/fonts.css
npx playwright install chromium
npm run images    # renders ../og-image.png and ../apple-touch-icon.png from tools/og-image.html and tools/apple-touch-icon.html
```

Already have Chrome? `PW_CHANNEL=chrome npm run images` skips the Chromium download.

`tools/release.py` needs only Python 3.

## Backlog

- Dutch version of the homepage and of the supplier details, with an EN/NL switch.
- Raise the Care price later (currently €95 / month excl. VAT).

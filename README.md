# zombombadil.com — artist site

Static single-page site for **ZomBombadil** (@zombombadil). No build step, no
external assets, no trackers. Works from `file://`, any subpath, or a domain root
(all URLs relative).

## Files
- `index.html` — page structure
- `style.css` — dark-cosmic styling (mobile-first)
- `site.js` — canvas starfield (green stars), tracklist rendering, audio wiring, scroll reveals
- `tracks.js` — **album data**: edit this to publish audio. Set a track's
  `audioUrl` (relative, e.g. `"audio/track01-two-trees.mp3"`) and its play
  button wakes up. Nothing else needs changing.
- `shots/` — headless verification screenshots (not for deploy)

## Deploy to GitHub Pages (project site)
1. New public repo, e.g. `zombombadil` (or `zombombadil.com` for a user site).
2. Upload `index.html`, `style.css`, `site.js`, `tracks.js` to the repo root
   (skip `shots/`).
3. Settings → Pages → Deploy from branch → `main` → Save.
4. Live at `https://<user>.github.io/zombombadil/`.

## Custom domain (after Nicholas buys zombombadil.com)
1. Registrar DNS: `A` records → GitHub Pages IPs (or `CNAME` → `<user>.github.io`).
2. Repo → Settings → Pages → Custom domain → `zombombadil.com` → Save.
   (GitHub provisions HTTPS automatically; also add `www` → CNAME.)
3. Optional: drop a `CNAME` file containing `zombombadil.com` in the repo root
   so the domain survives redeploys.

## Email (planned, not live)
`contact@zombombadil.com` via Cloudflare Email Routing → his Gmail, after the
domain purchase. The site already shows the address with a "routing being wired
up" note; update the note once routing is live.

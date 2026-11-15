# SnapYT — Cloudflare Pages deployment (fixed package)

## GitHub par files replace karne ka tarika
1. ZIP extract karo.
2. `SnapYT-Rebuild` folder kholo.
3. Is folder ke ANDAR ki saari files/folders GitHub repository `harwinder466/SnapYT` ke root mein upload karke purani files replace karo.
4. `public` aur `functions` dono folders repository ke root level par hone chahiye. `public` folder ke andar `index.html` hai; `functions` folder API endpoints ke liye hai.

## Cloudflare Pages setup (Workers deployment nahi)
Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git.
Repository: `harwinder466/SnapYT`
Production branch: `main`
Framework preset: `None`
Root directory: `/` (blank/default)
Build command: `npm run build`
Build output directory: `dist`

IMPORTANT: Workers ke form mein `npx wrangler deploy` / `npx wrangler preview` mat use karna. Pages project select karna.

## YouTube API secret
Pages project → Settings → Variables and Secrets → Production → Add secret:
Name: `YOUTUBE_API_KEY`
Value: apni YouTube Data API v3 key
Save karke new deployment trigger karo. API key ko GitHub mein mat daalna.

## Test after deployment
- Homepage: `https://YOUR-PROJECT.pages.dev/`
- API health: `https://YOUR-PROJECT.pages.dev/api/health`
- Sitemap: `https://YOUR-PROJECT.pages.dev/sitemap.xml`

Get Details ko public YouTube video se test karo. Agar error aaye, `/api/health` ka result aur Get Details error screenshot bhejo.

## Preserved IDs
AdSense publisher ID: `ca-pub-7693473877214734`
Google Analytics measurement ID: `G-Q461H88NSR`

Clear-link (✕) button is included. Existing canonical URLs and sitemap still point to the old Render URL intentionally; after final Pages URL is confirmed, update those URLs in a separate SEO update. Do not shut down Render until Pages website and API both work.

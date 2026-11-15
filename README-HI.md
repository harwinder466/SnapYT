# SnapYT — YouTube Thumbnail, Title & Description Tools

## Website mein kya hai?
- Same SnapYT name aur dark red/black responsive theme.
- Public YouTube video/Shorts URL paste karke details lana.
- Video ka full title (emojis samet) one-click copy.
- Full description (links, emojis aur line breaks samet) one-click copy.
- YouTube dwara us video ke liye diye gaye thumbnail sizes ka preview aur download.
- Video downloader, My media files, upload aur conversion options hata diye gaye hain.

## Important: YouTube API key zaroori hai
Full description aur complete video snippet ke liye YouTube Data API v3 use hoti hai. API key ke bina tool details nahi la sakta.

1. Google Cloud Console mein project banao.
2. YouTube Data API v3 enable karo.
3. API key banao aur us par suitable API restrictions lagao.
4. Render Dashboard → SnapYT Web Service → Environment mein `YOUTUBE_API_KEY` naam aur apni key value add karo.
5. Save karo; Render redeploy karega.
6. Key ko GitHub, HTML ya app.js mein kabhi mat daalna.

## Thumbnail quality ka sach
SnapYT wahi thumbnail resolutions show karta hai jo YouTube us video ke liye return karta hai. Har video ke liye 1080p, 2K ya 4K thumbnail available nahi hota. Website unavailable resolution ko fake/upscale karke asli 2K/4K nahi batayegi. Download button available thumbnail file download karta hai.

## GitHub / Render deployment
1. ZIP extract karo.
2. `SnapYT-Rebuild` folder ke andar ki files GitHub repository ke root mein upload karo — extra nested folder ke andar nahi.
3. Render Web Service settings: Build Command `npm install`; Start Command `npm start`; Node 20+.
4. `YOUTUBE_API_KEY` Render Environment mein add karo.
5. Deploy complete hone ke baad `https://YOUR-SERVICE.onrender.com` kholo. Health check: `/api/health`.

## Files
- `server.js` — Express backend and YouTube metadata API.
- `public/index.html`, `styles.css`, `app.js` — website UI and browser functionality.
- About, Contact, Privacy and Terms pages retained.

## Local test
Node.js 20+ ke saath `npm install` aur `npm start`, phir `http://localhost:3000` kholo. `.env.example` ko `.env` bana kar local API key set kar sakte ho (production key GitHub par upload mat karna).


## Thumbnail preview fix
Updated build mein thumbnail images same-origin `/api/thumbnail-preview/...` route se load hoti hain. Isse browser Content Security Policy / external image hotlinking ki wajah se broken thumbnail issue fix hota hai. GitHub par `public/app.js` aur `server.js` dono replace karein.

## AdSense preparation pages and privacy controls
- Added Help/FAQ, Guides index, four original educational guides, About, Contact, Privacy, Cookie Policy, Terms and Disclaimer pages.
- Contact email set to `dn2042221@gmail.com`.
- Added cookie choice banner with Accept all, Reject optional, Manage and footer Cookie Settings controls. The banner stores the visitor's choice in browser local storage.
- Existing GA4 measurement ID `G-Q461H88NSR` is loaded only after the visitor enables Analytics in cookie choices. It is not loaded after Reject optional.
- Added canonical tags, page descriptions, robots.txt and an updated sitemap.xml.
- No AdSense ad code has been inserted because an approved AdSense publisher account and publisher ID are needed. Do not add ad code until Google approves the site and provides the correct code.

## Important AdSense note
These improvements make the site more complete but cannot guarantee AdSense approval. Google reviews the live site, original content, navigation, functionality, policy compliance and other signals. Review every page and test the deployed site on mobile and desktop before applying. The current free `onrender.com` address is not a guarantee of acceptance or rejection; try adding the site in AdSense before purchasing a custom domain.

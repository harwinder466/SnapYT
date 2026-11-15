const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https://i.ytimg.com", "https://www.google-analytics.com", "https://www.googletagmanager.com", "https://*.googlesyndication.com", "https://*.doubleclick.net"],
      frameSrc: ["'self'", "https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://pagead2.googlesyndication.com", "https://*.googlesyndication.com", "https://*.doubleclick.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://www.googleapis.com", "https://i.ytimg.com", "https://www.google-analytics.com", "https://region1.google-analytics.com", "https://analytics.google.com", "https://stats.g.doubleclick.net", "https://*.googlesyndication.com", "https://*.doubleclick.net"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function getYouTubeId(input) {
  try {
    const u = new URL(input);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || null;
    if (!['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) return null;
    if (u.pathname === '/watch') return u.searchParams.get('v');
    const parts = u.pathname.split('/').filter(Boolean);
    if (['shorts', 'embed', 'live'].includes(parts[0])) return parts[1] || null;
  } catch {}
  return null;
}


// Read the real pixel dimensions from a JPEG. YouTube sometimes returns a
// 120x90 placeholder for a quality that is not actually available.
function jpegDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buffer.length) {
    if (buffer[i] !== 0xff) { i++; continue; }
    const marker = buffer[i + 1];
    i += 2;
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (i + 2 > buffer.length) return null;
    const size = buffer.readUInt16BE(i);
    if (size < 2 || i + size > buffer.length) return null;
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      return { width: buffer.readUInt16BE(i + 5), height: buffer.readUInt16BE(i + 3) };
    }
    i += size;
  }
  return null;
}
async function fetchVerifiedThumbnail(id, quality, expectedWidth, expectedHeight) {
  const files = { maxres: 'maxresdefault', standard: 'sddefault', high: 'hqdefault', medium: 'mqdefault', default: 'default' };
  const file = files[quality];
  if (!file) return null;
  const upstream = await fetch(`https://i.ytimg.com/vi/${id}/${file}.jpg`);
  if (!upstream.ok || !(upstream.headers.get('content-type') || '').includes('image/')) return null;
  const bytes = Buffer.from(await upstream.arrayBuffer());
  const dimensions = jpegDimensions(bytes);
  if (!dimensions || dimensions.width !== Number(expectedWidth) || dimensions.height !== Number(expectedHeight)) return null;
  // Reject tiny generic placeholders even if metadata is inconsistent.
  if (dimensions.width < 120 || dimensions.height < 90) return null;
  return { bytes, contentType: upstream.headers.get('content-type') || 'image/jpeg' };
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'SnapYT Metadata Tools' }));

app.post('/api/metadata', async (req, res) => {
  const id = getYouTubeId(String(req.body?.url || '').trim());
  if (!id || !/^[\w-]{11}$/.test(id)) return res.status(400).json({ error: 'Valid public YouTube video or Shorts link paste karo.' });
  if (!process.env.YOUTUBE_API_KEY) return res.status(503).json({ error: 'Full title aur description ke liye owner ko Render Environment mein YOUTUBE_API_KEY set karni hogi.' });
  try {
    const api = new URL('https://www.googleapis.com/youtube/v3/videos');
    api.search = new URLSearchParams({ part: 'snippet', id, key: process.env.YOUTUBE_API_KEY });
    const response = await fetch(api);
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data.error?.message || 'YouTube metadata load nahi hua.' });
    const video = data.items?.[0];
    if (!video) return res.status(404).json({ error: 'Video nahi mila. Link private, deleted ya unavailable ho sakta hai.' });
    const s = video.snippet;
    const thumbs = Object.entries(s.thumbnails || {}).map(([key, t]) => ({
      key, width: t.width || 0, height: t.height || 0,
      label: t.width >= 3840 ? '4K' : t.width >= 2560 ? '2K' : t.width >= 1920 ? '1080p' : t.width >= 1280 ? 'HD' : `${t.width}×${t.height}`,
      url: t.url
    })).sort((a,b) => b.width - a.width);
    res.json({ id, title: s.title || '', description: s.description || '', channel: s.channelTitle || '', thumbnails: thumbs });
  } catch {
    res.status(502).json({ error: 'YouTube se connect nahi ho paya. Thodi der baad try karo.' });
  }
});

// Only serve a thumbnail when its real dimensions match the dimensions
// reported by YouTube's metadata API. Missing sizes/placeholders are rejected.
app.get('/api/thumbnail-preview/:id/:quality', async (req, res) => {
  const { id, quality } = req.params;
  const { width, height } = req.query;
  if (!/^[\w-]{11}$/.test(id) || !/^(maxres|standard|high|medium|default)$/.test(quality) ||
      !/^\d{2,5}$/.test(String(width)) || !/^\d{2,5}$/.test(String(height))) {
    return res.status(400).send('Invalid thumbnail request.');
  }
  try {
    const image = await fetchVerifiedThumbnail(id, quality, width, height);
    if (!image) return res.status(404).send('This thumbnail size is not available.');
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(image.bytes);
  } catch { res.status(502).send('Thumbnail preview failed.'); }
});

app.get('/api/thumbnail/:id/:quality', async (req, res) => {
  const { id, quality } = req.params;
  const { width, height } = req.query;
  if (!/^[\w-]{11}$/.test(id) || !/^(maxres|standard|high|medium|default)$/.test(quality) ||
      !/^\d{2,5}$/.test(String(width)) || !/^\d{2,5}$/.test(String(height))) {
    return res.status(400).send('Invalid thumbnail request.');
  }
  try {
    const image = await fetchVerifiedThumbnail(id, quality, width, height);
    if (!image) return res.status(404).send('This thumbnail size is not available.');
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="SnapYT-${id}-${width}x${height}.jpg"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(image.bytes);
  } catch { res.status(502).send('Thumbnail download failed.'); }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT, () => console.log(`SnapYT running on port ${PORT}`));

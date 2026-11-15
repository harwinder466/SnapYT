import { getYouTubeId, json } from '../_utils.js';
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const id = getYouTubeId(String(body?.url || '').trim());
  if (!id || !/^[\w-]{11}$/.test(id)) return json({ error: 'Valid public YouTube video or Shorts link paste karo.' }, 400);
  if (!env.YOUTUBE_API_KEY) return json({ error: 'Full title aur description ke liye owner ko Cloudflare Pages settings mein YOUTUBE_API_KEY set karni hogi.' }, 503);
  try {
    const api = new URL('https://www.googleapis.com/youtube/v3/videos');
    api.search = new URLSearchParams({ part: 'snippet', id, key: env.YOUTUBE_API_KEY });
    const response = await fetch(api);
    const data = await response.json();
    if (!response.ok) return json({ error: data.error?.message || 'YouTube metadata load nahi hua.' }, 502);
    const video = data.items?.[0];
    if (!video) return json({ error: 'Video nahi mila. Link private, deleted ya unavailable ho sakta hai.' }, 404);
    const s = video.snippet;
    const thumbs = Object.entries(s.thumbnails || {}).map(([key, t]) => ({
      key, width: t.width || 0, height: t.height || 0,
      label: t.width >= 3840 ? '4K' : t.width >= 2560 ? '2K' : t.width >= 1920 ? '1080p' : t.width >= 1280 ? 'HD' : `${t.width}×${t.height}`,
      url: t.url
    })).sort((a,b) => b.width - a.width);
    return json({ id, title: s.title || '', description: s.description || '', channel: s.channelTitle || '', thumbnails: thumbs });
  } catch {
    return json({ error: 'YouTube se connect nahi ho paya. Thodi der baad try karo.' }, 502);
  }
}

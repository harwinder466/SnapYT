export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export function getYouTubeId(input) {
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

export function jpegDimensions(bytes) {
  if (!bytes || bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) { i++; continue; }
    const marker = bytes[i + 1];
    i += 2;
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (i + 2 > bytes.length) return null;
    const size = (bytes[i] << 8) | bytes[i + 1];
    if (size < 2 || i + size > bytes.length) return null;
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      return { width: (bytes[i + 5] << 8) | bytes[i + 6], height: (bytes[i + 3] << 8) | bytes[i + 4] };
    }
    i += size;
  }
  return null;
}

export async function fetchVerifiedThumbnail(id, quality, expectedWidth, expectedHeight) {
  const files = { maxres: 'maxresdefault', standard: 'sddefault', high: 'hqdefault', medium: 'mqdefault', default: 'default' };
  const file = files[quality];
  if (!file) return null;
  const upstream = await fetch(`https://i.ytimg.com/vi/${id}/${file}.jpg`);
  if (!upstream.ok || !(upstream.headers.get('content-type') || '').includes('image/')) return null;
  const bytes = new Uint8Array(await upstream.arrayBuffer());
  const dimensions = jpegDimensions(bytes);
  if (!dimensions || dimensions.width !== Number(expectedWidth) || dimensions.height !== Number(expectedHeight)) return null;
  if (dimensions.width < 120 || dimensions.height < 90) return null;
  return { bytes, contentType: upstream.headers.get('content-type') || 'image/jpeg' };
}

import { fetchVerifiedThumbnail } from '../../../_utils.js';
export async function onRequestGet({ params, request }) {
  const { id, quality } = params;
  const url = new URL(request.url);
  const width = url.searchParams.get('width');
  const height = url.searchParams.get('height');
  if (!/^[\w-]{11}$/.test(id) || !/^(maxres|standard|high|medium|default)$/.test(quality) || !/^\d{2,5}$/.test(String(width)) || !/^\d{2,5}$/.test(String(height))) return new Response('Invalid thumbnail request.', { status: 400 });
  try {
    const image = await fetchVerifiedThumbnail(id, quality, width, height);
    if (!image) return new Response('This thumbnail size is not available.', { status: 404 });
    return new Response(image.bytes, { headers: { 'content-type': image.contentType, 'content-disposition': 'inline', 'cache-control': 'public, max-age=86400' } });
  } catch { return new Response('Thumbnail preview failed.', { status: 502 }); }
}

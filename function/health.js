import { json } from '../_utils.js';
export function onRequestGet() {
  return json({ ok: true, service: 'SnapYT Metadata Tools', hosting: 'Cloudflare Pages Functions' });
}

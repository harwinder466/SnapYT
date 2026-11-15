import { cp, mkdir, rm } from 'node:fs/promises';

// Cloudflare Pages static output. The /functions directory stays at the
// repository root so Pages can compile the API routes separately.
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
console.log('SnapYT static files copied from public/ to dist/.');

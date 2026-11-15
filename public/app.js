const $ = id => document.getElementById(id);
const escapeHTML = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const old = button.textContent; button.textContent = 'Copied ✓';
    setTimeout(() => button.textContent = old, 1600);
  } catch { alert('Copy nahi ho paya. Browser clipboard permission check karo.'); }
}
$('previewBtn').addEventListener('click', async () => {
  const box = $('previewResult'); box.classList.remove('hidden'); box.textContent = 'Loading video details…';
  $('previewBtn').disabled = true;
  try {
    const r = await fetch('/api/metadata', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url:$('videoUrl').value.trim()}) });
    const raw = await r.text();
    let d;
    try { d = raw ? JSON.parse(raw) : {}; }
    catch { throw new Error(`Server se valid response nahi mila (HTTP ${r.status}). Cloudflare Pages deployment/API settings check karo.`); }
    if (!r.ok) throw new Error(d.error || `Request failed (HTTP ${r.status})`);
    const thumbCards = d.thumbnails.map(t => `<article class="thumb-option"><img src="/api/thumbnail-preview/${encodeURIComponent(d.id)}/${encodeURIComponent(t.key)}?width=${t.width}&height=${t.height}" alt="${escapeHTML(t.label)} thumbnail" loading="lazy"><div class="thumb-meta"><b>${escapeHTML(t.label)}</b><small>${t.width} × ${t.height}</small></div><a class="download-btn" href="/api/thumbnail/${encodeURIComponent(d.id)}/${encodeURIComponent(t.key)}?width=${t.width}&height=${t.height}">Download</a></article>`).join('');
    box.innerHTML = `<div class="video-heading"><h2>${escapeHTML(d.title)}</h2><button class="copy-btn" id="copyTitle">Copy title</button></div><p class="channel">${escapeHTML(d.channel)}</p><h3 class="section-label">Available thumbnails</h3><div class="thumb-grid" id="thumbGrid">${thumbCards || '<p>No downloadable thumbnail sizes were found for this video.</p>'}</div><p class="resolution-note">Only thumbnail sizes that load as real images are shown. Unavailable sizes and YouTube placeholder images are automatically hidden.</p><div class="description-head"><h3 class="section-label">Full description</h3><button class="copy-btn" id="copyDescription">Copy description</button></div><pre class="description">${escapeHTML(d.description || 'This video has no description.')}</pre>`;
    // If YouTube serves a placeholder or unavailable image, remove the whole
    // card so the user never sees a download option for a broken thumbnail.
    box.querySelectorAll('.thumb-option img').forEach(img => {
      img.addEventListener('error', () => {
        img.closest('.thumb-option')?.remove();
        const grid = $('thumbGrid');
        if (grid && !grid.querySelector('.thumb-option')) {
          grid.innerHTML = '<p>No downloadable thumbnail sizes are available for this video.</p>';
        }
      }, { once: true });
    });
    $('copyTitle').addEventListener('click', e => copyText(d.title, e.currentTarget));
    $('copyDescription').addEventListener('click', e => copyText(d.description || '', e.currentTarget));
  } catch(e) { box.textContent = e.message; }
  finally { $('previewBtn').disabled = false; }
});
$('videoUrl').addEventListener('keydown', e => { if (e.key === 'Enter') $('previewBtn').click(); });

// Clear the complete pasted YouTube URL with one tap.
$('clearUrlBtn').addEventListener('click', () => {
  $('videoUrl').value = '';
  $('previewResult').classList.add('hidden');
  $('previewResult').textContent = '';
  $('videoUrl').focus();
});

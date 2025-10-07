// Paste this into the browser DevTools Console and call:
// checkJS('/src/main.js') or checkJS('http://localhost:8000/src/main.js')
async function checkJS(url, opts = {}) {
  console.log('Checking URL:', url);
  try {
    const resp = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-cache' });
    console.log('Fetch succeeded. Status:', resp.status, resp.statusText);
    console.log('Response headers:');
    for (const pair of resp.headers.entries()) console.log('  ' + pair[0] + ': ' + pair[1]);
    const ct = resp.headers.get('content-type') || '';
    console.log('Content-Type:', ct);
    const len = resp.headers.get('content-length') || '(unknown)';
    console.log('Content-Length:', len);
    // show a short snippet of the body to confirm it's JS text
    const text = await resp.text();
    const sample = text.slice(0, 1200);
    console.log('--- body snippet (first 1200 chars) ---\n' + sample + (text.length > 1200 ? '\n... (truncated)':''));
    if (!ct.includes('javascript') && !ct.includes('application/javascript') && !ct.includes('text/javascript')) {
      console.warn('Warning: Content-Type does not look like JavaScript. This can break ES module import.');
    }
  } catch (err) {
    console.error('Fetch failed:', err);
    if (err instanceof TypeError) {
      console.error('Likely a CORS or network issue (or file://). Ensure the file is served via http(s) and server returns proper Content-Type.');
    }
  }
}

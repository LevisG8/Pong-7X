// Robust main.js with an on-screen error overlay to surface module/load/runtime errors
import GameManager from './GameManager.js';

window.PONG_DEBUG = true;
window._PONG = window._PONG || {};

// Create an on-screen error box so failures are visible without DevTools
(function createErrorOverlay() {
  const id = 'pong-error-overlay';
  if (document.getElementById(id)) return;
  const el = document.createElement('div');
  el.id = id;
  Object.assign(el.style, {
    position: 'fixed',
    left: '12px',
    right: '12px',
    top: '12px',
    zIndex: 999999,
    background: 'linear-gradient(180deg, rgba(40,10,10,0.96), rgba(24,8,8,0.94))',
    color: '#fff',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
    maxHeight: '60vh',
    overflow: 'auto',
    display: 'none',
    whiteSpace: 'pre-wrap'
  });
  el.innerHTML = '<strong style="display:block;margin-bottom:6px">Runtime Error</strong><div id="pong-error-content"></div><div style="margin-top:8px;text-align:right"><button id="pong-error-close" style="padding:6px 10px;border-radius:6px;border:none;background:#43e97b;color:#111;font-weight:700">Dismiss</button></div>';
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(el);
    document.getElementById('pong-error-close').onclick = () => { el.style.display = 'none'; };
  });
})();

function showError(msg) {
  try {
    const el = document.getElementById('pong-error-overlay');
    const content = document.getElementById('pong-error-content');
    if (content) {
      content.textContent = (new Date()).toLocaleString() + ' — ' + msg;
      el.style.display = 'block';
    } else {
      alert('Error: ' + msg);
    }
  } catch (e) {
    // fallback
    console.error('Could not show error overlay', e);
    alert(msg);
  }
}

// Global error handlers to capture any uncaught errors / promise rejections
window.addEventListener('error', (ev) => {
  const msg = (ev && ev.error && ev.error.stack) ? ev.error.stack : (ev && ev.message) ? ev.message : String(ev);
  console.error('Uncaught error:', ev);
  showError('Uncaught error: ' + msg);
});

window.addEventListener('unhandledrejection', (ev) => {
  const reason = ev && ev.reason ? (ev.reason.stack || ev.reason) : ev;
  console.error('Unhandled rejection:', reason);
  showError('Unhandled rejection: ' + (reason && reason.toString ? reason.toString() : JSON.stringify(reason)));
});

// Main boot
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('pong');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayDesc = document.getElementById('overlay-desc');
  const overlayBtn = document.getElementById('overlay-btn');

  if (!canvas) {
    const msg = 'Canvas element #pong not found in DOM. Check index.html.';
    console.error(msg);
    showError(msg);
    return;
  }

  let game;
  try {
    game = new GameManager(canvas, {
      overlay,
      overlayTitle,
      overlayDesc,
      overlayBtn
    });
    window._PONG.game = game;
  } catch (e) {
    console.error('Failed to construct GameManager:', e);
    showError('Failed to construct GameManager: ' + (e && e.stack ? e.stack : e));
    return;
  }

  // Try to detect and load local audio files (non-blocking)
  try {
    const base = location.origin;
    // HEAD on local asset to check existence — server must support HEAD; fallback to GET with range if not.
    const url = '/assets/audio/paddle.wav';
    const resp = await fetch(url, { method: 'HEAD' }).catch(() => null);
    if (resp && resp.ok) {
      try { game.audio.loadLocalAssets('/assets/audio/'); console.log('Loaded local audio from /assets/audio/'); }
      catch (ae) { console.warn('Audio loadLocalAssets failed', ae); }
    }
  } catch (e) {
    console.warn('Local audio detection failed', e);
  }

  // Initialize the game (safe-call guarded)
  try {
    game.init();
  } catch (e) {
    console.error('Game init failed:', e);
    showError('Game.init() threw: ' + (e && e.stack ? e.stack : e));
    return;
  }

  // Attach a fallback start-button handler so the Start button always triggers start
  try {
    overlayBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      console.log('Overlay Start clicked (fallback)');
      try {
        if (game.state !== 'playing') {
          game.startGame();
          game.hideOverlay();
          try { canvas.focus(); } catch {}
        } else {
          game.hideOverlay();
          try { canvas.focus(); } catch {}
        }
      } catch (err) {
        console.error('Fallback start handler failed:', err);
        showError('Start handler failed: ' + (err && err.stack ? err.stack : err));
      }
    }, { passive: false });
  } catch (e) {
    console.warn('Could not attach fallback start handler', e);
  }

  // Quick sanity check: ensure main game loop is active soon after init
  setTimeout(() => {
    try {
      if (!game || typeof game.loop !== 'function') {
        showError('Game loop not present. Check console for module errors.');
      } else {
        console.log('Game appears initialized. State:', game.state);
      }
    } catch (e) {
      console.error('Sanity check failed', e);
    }
  }, 1200);
});

// AudioManager with robust fallbacks and WebAudio tone generator when files are missing.
// Tries local assets -> CDN fallback -> WebAudio-generated tones.
// Emits pong-log when using fallbacks so DebugOverlay shows it.
const AUDIO_SETTINGS_KEY = 'pong-audio-v1';

export default class AudioManager {
  constructor() {
    this.defaultSources = {
      paddle: "https://cdn.jsdelivr.net/gh/knighty7-ciper/pong-sounds@main/paddle.wav",
      wall: "https://cdn.jsdelivr.net/gh/knighty7-ciper/pong-sounds@main/wall.wav",
      score: "https://cdn.jsdelivr.net/gh/knighty7-ciper/pong-sounds@main/score.wav"
    };

    // HTMLAudio elements (may be null if unavailable)
    this.sounds = { paddle: null, wall: null, score: null };

    // Try to create HTMLAudio for CDN defaults (non-blocking)
    try {
      this.sounds.paddle = new Audio(this.defaultSources.paddle);
      this.sounds.wall = new Audio(this.defaultSources.wall);
      this.sounds.score = new Audio(this.defaultSources.score);
    } catch (e) {
      this.sounds = { paddle: null, wall: null, score: null };
    }

    // Music element
    try {
      this.music = new Audio();
      this.music.loop = true;
    } catch {
      this.music = null;
    }

    // WebAudio context for synthesized fallback tones
    this._audioCtx = null;
    this._useWebAudio = true;
    this._failedSounds = new Set();
    this.localBase = null;

    // persisted mute
    this.muted = false;
    try {
      const s = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) || '{}');
      if (s.muted) this.muted = true;
    } catch {}
  }

  // ensure AudioContext when needed
  _ensureAudioContext() {
    if (this._audioCtx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this._audioCtx = new AC();
    } catch (e) {
      this._audioCtx = null;
    }
  }

  // Play named effect: paddle | wall | score
  play(name) {
    if (this.muted) return;
    if (!name) return;
    // skip if marked failed and we have WebAudio fallback available
    if (this._failedSounds.has(name) && this._useWebAudio) {
      this._playToneFallback(name);
      return;
    }

    const audioEl = this.sounds[name];
    if (audioEl) {
      try {
        audioEl.currentTime = 0;
        const p = audioEl.play();
        if (p && typeof p.catch === 'function') {
          p.catch((err) => {
            // if it fails (404/CORS/NotAllowed), mark failed and fallback to tone
            if (!this._failedSounds.has(name)) {
              console.warn(`AudioManager: audio.play() failed for ${name}:`, err && err.message ? err.message : err);
            }
            this._failedSounds.add(name);
            window.dispatchEvent(new CustomEvent('pong-log', { detail: { text: `Audio fallback used for ${name}`, category: 'warn' } }));
            this._playToneFallback(name);
          });
        }
        return;
      } catch (e) {
        // fall through to fallback
        this._failedSounds.add(name);
      }
    }

    // No usable HTMLAudio: use WebAudio tone fallback
    this._playToneFallback(name);
  }

  // Generate a short tone depending on sound name
  _playToneFallback(name) {
    this._ensureAudioContext();
    if (!this._audioCtx) return; // no audio support
    const ctx = this._audioCtx;
    const now = ctx.currentTime;
    // Choose frequency/pattern per effect
    let freq = 500, dur = 0.08, type = 'sine';
    if (name === 'paddle') { freq = 700; dur = 0.06; type = 'square'; }
    if (name === 'wall') { freq = 320; dur = 0.08; type = 'sine'; }
    if (name === 'score') { freq = 900; dur = 0.18; type = 'sawtooth'; }
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
      // cleanup on end
      setTimeout(() => { try { osc.disconnect(); gain.disconnect(); } catch (e) {} }, (dur + 0.1) * 1000);
      window.dispatchEvent(new CustomEvent('pong-log', { detail: { text: `WebAudio tone played for ${name}`, category: 'info' } }));
    } catch (e) {
      // give up silently
      console.warn('AudioManager: WebAudio fallback failed', e);
    }
  }

  // Play theme music (url optional). If fails, mark music failed and continue silently.
  playMusic(url) {
    if (!url) return;
    if (this.muted) return;
    if (!this.music) {
      try { this.music = new Audio(); this.music.loop = true; } catch (e) { this.music = null; }
    }
    if (!this.music) return;
    try {
      if (this.music.src !== url) this.music.src = url;
      const p = this.music.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('AudioManager: music play failed:', err && err.message ? err.message : err);
          window.dispatchEvent(new CustomEvent('pong-log', { detail: { text: 'Music playback failed; muted or blocked by browser', category: 'warn' } }));
        });
      }
    } catch (e) {
      console.warn('AudioManager: playMusic error', e);
    }
  }

  stopMusic() {
    try { if (this.music) { this.music.pause(); this.music.currentTime = 0; } } catch (e) {}
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      Object.values(this.sounds).forEach(s => { if (s) s.muted = this.muted; });
      if (this.music) this.music.muted = this.muted;
      if (this.muted) this.stopMusic(); else this.playMusic(this.music ? this.music.src : '');
    } catch (e) {}
    try { localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify({ muted: this.muted })); } catch (e) {}
  }

  // Try to load local assets from basePath (/assets/audio/) and create Audio elements.
  // This is non-blocking but awaits HEAD checks to avoid creating 404 audio sources.
  async loadLocalAssets(basePath) {
    if (!basePath) return false;
    this.localBase = basePath.endsWith('/') ? basePath : basePath + '/';
    const mapping = { paddle: 'paddle.wav', wall: 'wall.wav', score: 'score.wav' };
    for (const [name, filename] of Object.entries(mapping)) {
      const url = this.localBase + filename;
      try {
        // HEAD to check existence (fallback to GET if HEAD not allowed)
        let ok = false;
        try {
          const head = await fetch(url, { method: 'HEAD' });
          ok = head && head.ok;
        } catch {
          // try GET
          const r = await fetch(url, { method: 'GET' });
          ok = r && r.ok;
        }
        if (ok) {
          try {
            this.sounds[name] = new Audio(url);
            if (this._failedSounds.has(name)) this._failedSounds.delete(name);
            window.dispatchEvent(new CustomEvent('pong-log', { detail: { text: `Loaded local audio: ${filename}`, category: 'info' } }));
            continue;
          } catch (e) {
            console.warn('AudioManager: failed to construct Audio for', url, e);
            this._failedSounds.add(name);
            continue;
          }
        } else {
          // not found - keep fallback and mark failed so we use WebAudio
          this._failedSounds.add(name);
        }
      } catch (e) {
        this._failedSounds.add(name);
      }
    }
    return true;
  }
}

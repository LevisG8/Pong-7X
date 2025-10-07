// ReplaySystem with last & best replay persistence and helpers
const REPLAY_LAST_KEY = 'pong-replay-last';
const REPLAY_BEST_KEY = 'pong-replay-best';

export default class ReplaySystem {
  constructor(game) {
    this.game = game;
    this.frames = [];
    this.maxFrames = 360;
    this.isReplaying = false;
    this.playIndex = 0;
    this._playingFrames = null;
  }

  record(state) {
    if (this.isReplaying) return;
    this.frames.push(JSON.parse(JSON.stringify(state)));
    if (this.frames.length > this.maxFrames) this.frames.shift();
  }

  startReplay() {
    if (this.frames.length === 0) return;
    this.isReplaying = true;
    this.playIndex = 0;
  }

  // Start replay from provided frames (array) - used for last / best saved replays
  startReplayFromFrames(frames) {
    if (!frames || frames.length === 0) return;
    this._playingFrames = frames;
    this.isReplaying = true;
    this.playIndex = 0;
  }

  stepReplay() {
    if (!this.isReplaying) return null;
    const source = this._playingFrames || this.frames;
    if (!source) return null;
    if (this.playIndex >= source.length) {
      this.isReplaying = false;
      this._playingFrames = null;
      return null;
    }
    return source[this.playIndex++];
  }

  reset() { this.frames = []; this.isReplaying = false; this.playIndex = 0; this._playingFrames = null; }

  // persistence helpers
  saveLast(frames) {
    try { localStorage.setItem(REPLAY_LAST_KEY, JSON.stringify(frames)); } catch (e) {}
  }
  getLast() {
    try { return JSON.parse(localStorage.getItem(REPLAY_LAST_KEY) || 'null'); } catch { return null; }
  }
  hasLast() { return !!this.getLast(); }

  saveBest(frames, len) {
    try {
      const payload = { frames, len, savedAt: Date.now() };
      localStorage.setItem(REPLAY_BEST_KEY, JSON.stringify(payload));
    } catch (e) {}
  }
  getBest() {
    try {
      const p = JSON.parse(localStorage.getItem(REPLAY_BEST_KEY) || 'null');
      return p ? p.frames : null;
    } catch { return null; }
  }
  getBestLength() {
    try {
      const p = JSON.parse(localStorage.getItem(REPLAY_BEST_KEY) || 'null');
      return p ? (p.len || 0) : 0;
    } catch { return 0; }
  }
}

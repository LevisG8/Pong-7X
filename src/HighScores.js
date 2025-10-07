export default class HighScores {
  constructor() {
    this.key = "ultimate-pong-highscores";
    this.data = this.load();
  }

  load() {
    try {
      const d = localStorage.getItem(this.key);
      return d ? JSON.parse(d) : { classic: 0, timed: 0, endless: 0 };
    } catch {
      return { classic: 0, timed: 0, endless: 0 };
    }
  }

  save(mode, score) {
    if (score > (this.data[mode] || 0)) {
      this.data[mode] = score;
      localStorage.setItem(this.key, JSON.stringify(this.data));
    }
  }

  get(mode) { return this.data[mode] || 0; }

  draw(ctx, canvas, mode) {
    ctx.save();
    ctx.font = "14px Arial";
    ctx.fillStyle = "#fffa";
    ctx.textAlign = "right";
    ctx.fillText(`High: ${this.get(mode)}`, canvas.width - 18, 18);
    ctx.restore();
  }
}

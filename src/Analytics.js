export default class Analytics {
  constructor() { this.reset(); }
  reset() {
    this.rally = 0;
    this.longestRally = 0;
    this.powerUps = 0;
    this.hits = 0;
    this.misses = 0;
    this.multiBallScores = 0;
  }
  hit() { this.rally++; this.hits++; if (this.rally > this.longestRally) this.longestRally = this.rally; }
  miss() { this.rally = 0; this.misses++; }
  powerUp() { this.powerUps++; }
  multiBall() { this.multiBallScores++; }
  draw(ctx, canvas) {
    ctx.save();
    ctx.font = "14px Arial";
    ctx.fillStyle = "#bfffcf";
    ctx.textAlign = "left";
    ctx.fillText(`Longest Rally: ${this.longestRally}`, 18, canvas.height - 60);
    ctx.fillText(`Power-Ups: ${this.powerUps}`, 18, canvas.height - 42);
    ctx.fillText(`Multi-Ball Scores: ${this.multiBallScores}`, 18, canvas.height - 24);
    ctx.restore();
  }
}

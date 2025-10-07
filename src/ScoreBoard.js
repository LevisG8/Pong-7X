export default class ScoreBoard {
  constructor() {
    this.scores = { player1: 0, player2: 0, ai: 0 };
    this.mode = "classic";
    this.timeLeft = 60;
    this.winningScore = 7;
  }

  reset(mode = "classic") {
    this.scores.player1 = 0;
    this.scores.player2 = 0;
    this.scores.ai = 0;
    this.mode = mode;
    this.timeLeft = 60;
  }

  addScore(who, amt = 1) {
    if (!(who in this.scores)) return;
    this.scores[who] += amt;
  }

  draw(ctx, canvas) {
    ctx.save();
    ctx.font = "46px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(this.scores.player1, canvas.width / 2 - 110, 32);
    const rightLabel = (this.scores.player2 !== 0) ? this.scores.player2 : this.scores.ai;
    ctx.fillText(rightLabel, canvas.width / 2 + 110, 32);
    if (this.mode === 'timed') {
      ctx.font = "18px Arial";
      ctx.fillText(`${Math.ceil(this.timeLeft)}s`, canvas.width / 2, 14);
    }
    ctx.restore();
  }
}

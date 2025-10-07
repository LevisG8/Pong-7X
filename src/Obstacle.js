export default class Obstacle {
  constructor(x, y, w, h, type = "block", movePattern = null) {
    this.x = x; this.y = y; this.width = w; this.height = h;
    this.movePattern = movePattern;
    this.baseY = y; this.baseX = x;
  }

  update(dt, t) {
    if (this.movePattern) {
      const pos = this.movePattern(t, this.baseX, this.baseY);
      if (pos.x !== undefined) this.x = pos.x;
      if (pos.y !== undefined) this.y = pos.y;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#ffd20088";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }

  checkCollision(ball) {
    return (
      ball.x + ball.radius > this.x &&
      ball.x - ball.radius < this.x + this.width &&
      ball.y + ball.radius > this.y &&
      ball.y - ball.radius < this.y + this.height
    );
  }
}

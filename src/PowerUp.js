export default class PowerUp {
  constructor(type, x, y, effectDuration = 5) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.active = false;
    this.effectDuration = effectDuration;
    this.timer = 0;
    this.collectedBy = null;
    this.color = {
      enlarge: "#43e97b",
      shrink: "#ff2d55",
      multi: "#f7971e",
      slow: "#38f9d7",
      speed: "#ffd200",
      invisible: "#fff"
    }[type] || "#fff";
    this.icon = {
      enlarge: "⬆️",
      shrink: "⬇️",
      multi: "🔵",
      slow: "🐢",
      speed: "⚡",
      invisible: "👻"
    }[type] || "?";
  }

  update(dt, game) {
    this.y += Math.sin(performance.now() / 250 + this.x) * 0.1;
    if (this.active) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.endEffect(game);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.active ? 0.3 : 0.95;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#111";
    ctx.fillText(this.icon, this.x, this.y + 2);
    ctx.restore();
  }

  activate(game, paddle) {
    this.active = true;
    this.collectedBy = paddle;
    this.timer = this.effectDuration;
    window.dispatchEvent(new CustomEvent('pong-log', { detail: { text: `PowerUp activated: ${this.type} by ${paddle.type}`, category: 'powerup' } }));
    if (window.PONG_DEBUG !== false) console.log(`PowerUp activated: ${this.type} by ${paddle.type}`);

    switch (this.type) {
      case "enlarge":
        paddle.height *= 1.7;
        break;
      case "shrink":
        paddle.height *= 0.6;
        break;
      case "multi":
        if (game.balls.length < 3) {
          const b = game.balls[0];
          game.balls.push(new game.balls[0].constructor(b.x, b.y, b.radius, b.color));
          if (game.analytics) game.analytics.multiBall();
        }
        break;
      case "slow":
        game.balls.forEach(b => b.speed *= 0.6);
        break;
      case "speed":
        game.balls.forEach(b => b.speed *= 1.4);
        break;
      case "invisible":
        paddle.invisible = true;
        break;
    }
  }

  endEffect(game) {
    if (!this.collectedBy) return;
    switch (this.type) {
      case "enlarge":
      case "shrink":
        this.collectedBy.height = this.collectedBy.defaultHeight || 96;
        break;
      case "slow":
      case "speed":
        game.balls.forEach(b => b.speed = b.defaultSpeed || 6);
        break;
      case "invisible":
        this.collectedBy.invisible = false;
        break;
    }
    this.active = false;
  }

  checkCollision(paddle) {
    let px = Math.max(paddle.x, Math.min(this.x, paddle.x + paddle.width));
    let py = Math.max(paddle.y, Math.min(this.y, paddle.y + paddle.height));
    let dx = this.x - px, dy = this.y - py;
    return dx * dx + dy * dy < this.radius * this.radius;
  }
}

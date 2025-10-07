export default class Achievements {
  constructor(game) {
    this.game = game;
    this.achievements = [
      { id: "rally10", name: "10-Hit Rally", desc: "Reach a 10-hit rally!", unlocked: false },
      { id: "power5", name: "Power Maniac", desc: "Collect 5 power-ups in one match!", unlocked: false },
      { id: "flawless", name: "Flawless!", desc: "Win without the opponent scoring.", unlocked: false },
      { id: "multiball", name: "Multi Mayhem", desc: "Score while 2+ balls are active.", unlocked: false }
    ];
    this.queue = [];
    this.timer = 0;
  }

  unlock(id) {
    const a = this.achievements.find(x => x.id === id);
    if (a && !a.unlocked) {
      a.unlocked = true;
      this.queue.push(a);
      this.timer = 2.5;
    }
  }

  update(dt) {
    if (this.queue.length > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.queue.shift();
        this.timer = 2.5;
      }
    }
  }

  draw(ctx, canvas) {
    if (this.queue.length === 0) return;
    const a = this.queue[0];
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#232526ee";
    ctx.fillRect(canvas.width / 2 - 170, 70, 340, 72);
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#43e97b";
    ctx.textAlign = "center";
    ctx.fillText("Achievement Unlocked!", canvas.width / 2, 96);
    ctx.font = "16px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${a.name} — ${a.desc}`, canvas.width / 2, 118);
    ctx.restore();
  }

  reset() {
    for (const a of this.achievements) a.unlocked = false;
    this.queue = [];
  }
}

export default class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    // Cap particles based on device capabilities
    const hw = navigator.hardwareConcurrency || 4;
    this.maxParticles = Math.min(600, 100 + hw * 50);
  }

  spawn(x, y, color, count = 10, speed = 3, size = 4, duration = 0.5) {
    // clamp spawn to available budget
    const available = Math.max(0, this.maxParticles - this.particles.length);
    const toSpawn = Math.min(count, available);
    for (let i = 0; i < toSpawn; ++i) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.7 + Math.random() * 0.6);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color,
        size: size * (0.7 + Math.random() * 0.5),
        life: duration,
        maxLife: duration
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; --i) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

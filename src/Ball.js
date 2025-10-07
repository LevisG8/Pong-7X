export default class Ball {
  constructor(x, y, radius, color, speed = null) {
    this.initX = x
    this.initY = y
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    // accept injected speed from GameManager (difficulty)
    this.defaultSpeed = speed || 6
    this.speed = this.defaultSpeed
    this.velocityX = Math.random() > 0.5 ? this.speed : -this.speed
    this.velocityY = (Math.random() - 0.5) * this.speed
    this.trail = []
    this.maxTrail = 12
  }

  update(dt, game) {
    // move with velocity considering dt to be consistent
    this.x += this.velocityX * dt * 60
    this.y += this.velocityY * dt * 60

    // trail
    this.trail.unshift({ x: this.x, y: this.y })
    if (this.trail.length > this.maxTrail) this.trail.pop()

    // walls
    if (this.y - this.radius < 0 || this.y + this.radius > game.canvas.height) {
      this.velocityY *= -1
      this.y = this.y < game.canvas.height / 2 ? this.radius : game.canvas.height - this.radius
      if (game.audio) game.audio.play("wall")
      if (game.particles) game.particles.spawn(this.x, this.y, game.theme.getCurrent().particleColor, 12, 6, 4, 0.6)
    }

    // paddles
    for (const paddle of game.players) {
      if (
        this.x - this.radius < paddle.x + paddle.width &&
        this.x + this.radius > paddle.x &&
        this.y - this.radius < paddle.y + paddle.height &&
        this.y + this.radius > paddle.y
      ) {
        const impact = (this.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2)
        const angle = (Math.PI / 4) * impact
        const dir = paddle.x < game.canvas.width / 2 ? 1 : -1
        // increase speed slightly on hit but cap at a higher value
        const curSpeed = Math.min(20, Math.abs(this.velocityX) * 1.03 + 0.4)
        this.speed = curSpeed
        this.velocityX = dir * this.speed * Math.cos(angle)
        this.velocityY = this.speed * Math.sin(angle)
        this.x = paddle.x + (dir > 0 ? paddle.width + this.radius + 1 : -this.radius - 1)
        if (game.audio) game.audio.play("paddle")
        if (game.particles) game.particles.spawn(this.x, this.y, paddle.color, 18, 5, 4, 0.5)
        if (game.analytics) game.analytics.hit()

        try {
          if (navigator.vibrate) navigator.vibrate(10)
        } catch (e) {}

        window.dispatchEvent(
          new CustomEvent("pong-log", {
            detail: { text: `Paddle hit at y=${Math.round(this.y)} by ${paddle.type}`, category: "hit" },
          }),
        )
        if (window.PONG_DEBUG !== false) console.log(`Paddle hit at y=${Math.round(this.y)} by ${paddle.type}`)
        break
      }
    }

    // scoring (left/right)
    if (this.x - this.radius < 0) {
      window.dispatchEvent(
        new CustomEvent("pong-log", { detail: { text: "Ball out left — Player 2 scores", category: "score" } }),
      )
      if (game && typeof game.onScore === "function") game.onScore("player2")
      return
    }
    if (this.x + this.radius > game.canvas.width) {
      window.dispatchEvent(
        new CustomEvent("pong-log", { detail: { text: "Ball out right — Player 1 scores", category: "score" } }),
      )
      if (game && typeof game.onScore === "function") game.onScore("player1")
      return
    }
  }

  draw(ctx) {
    for (let i = this.trail.length - 1; i >= 1; --i) {
      const p = this.trail[i]
      ctx.save()
      ctx.globalAlpha = 0.04 + (i / this.trail.length) * 0.18
      ctx.beginPath()
      ctx.arc(p.x, p.y, this.radius * 0.8 * (i / this.trail.length), 0, Math.PI * 2)
      ctx.fillStyle = this.color
      ctx.fill()
      ctx.restore()
    }
    ctx.save()
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

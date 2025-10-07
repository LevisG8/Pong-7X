// Paddle with frame-rate independent movement and improved AI tracking using difficulty
export default class Paddle {
  constructor(x, y, width, height, color, type = "player1") {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.color = color
    this.type = type // "player1", "player2", "ai"
    this.speed = 6 // base speed will be replaced by DifficultyManager
    this.moveUp = false
    this.moveDown = false
    this.invisible = false
    this.defaultHeight = height
  }

  update(dt, game) {
    const step = (this.speed || 6) * dt * 60 // normalize per-frame
    if (this.type === "player1" || this.type === "player2") {
      if (this.moveUp) this.y -= step
      if (this.moveDown) this.y += step
      this.y = Math.max(0, Math.min(game.canvas.height - this.height, this.y))
    } else if (this.type === "ai") {
      // Defensive: ensure a ball exists
      const ball = game && game.balls && game.balls.length > 0 ? game.balls[0] : null
      if (!ball) return
      // AI speed / responsiveness derived from difficulty
      const aiMultiplier =
        game && game.difficulty ? game.difficulty.getAILevel(game.scoreBoard.scores.player1 || 0) : 1.0
      const paddleBaseSpeed = game && game.difficulty ? game.difficulty.getPaddleSpeed() : this.speed

      const targetY = ball.y - this.height / 2
      const diff = targetY - this.y

      const reactionSpeed = paddleBaseSpeed * aiMultiplier * dt * 60
      const maxMove = reactionSpeed * 1.2

      const move = Math.sign(diff) * Math.min(Math.abs(diff), Math.max(0.5, Math.abs(maxMove)))
      this.y += move
      this.y = Math.max(0, Math.min(game.canvas.height - this.height, this.y))
    }
  }

  draw(ctx) {
    if (this.invisible) return
    ctx.save()
    ctx.fillStyle = this.color
    ctx.fillRect(this.x, this.y, this.width, this.height)
    ctx.restore()
  }
}

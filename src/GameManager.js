// src/GameManager.js - patched: instantiate InputManager with the game object,
// apply difficulty to paddles/ball, defensive rendering, cleanup, etc.

import Paddle from "./Paddle.js"
import Ball from "./Ball.js"
import PowerUp from "./PowerUp.js"
import Obstacle from "./Obstacle.js"
import ParticleSystem from "./ParticleSystem.js"
import ThemeManager from "./ThemeManager.js"
import InputManager from "./InputManager.js"
import AudioManager from "./AudioManager.js"
import ScoreBoard from "./ScoreBoard.js"
import Achievements from "./Achievements.js"
import Analytics from "./Analytics.js"
import ReplaySystem from "./ReplaySystem.js"
import Customization from "./Customization.js"
import DifficultyManager from "./DifficultyManager.js"
import GamepadManager from "./GamepadManager.js"
import HighScores from "./HighScores.js"
import Tutorial from "./Tutorial.js"
import SettingsMenu from "./SettingsMenu.js"
import DebugOverlay from "./DebugOverlay.js"
import TouchJoystick from "./TouchJoystick.js"

const SETTINGS_KEY = "pong-settings-v1"

export default class GameManager {
  constructor(canvas, overlayElements) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.overlay = overlayElements.overlay
    this.overlayTitle = overlayElements.overlayTitle
    this.overlayDesc = overlayElements.overlayDesc
    this.overlayBtn = overlayElements.overlayBtn

    this.state = "start"
    this.players = []
    this.balls = []
    this.powerUps = []
    this.obstacles = []
    this.lastTimestamp = 0

    this.theme = new ThemeManager(this)
    this.particles = new ParticleSystem(this)
    this.audio = new AudioManager()
    this.scoreBoard = new ScoreBoard()
    this.customization = new Customization()
    this.difficulty = new DifficultyManager(this)
    this.highScores = new HighScores()
    this.tutorial = new Tutorial(this)
    this.settings = new SettingsMenu(this)
    this.achievements = new Achievements(this)
    this.analytics = new Analytics()
    this.replay = new ReplaySystem(this)

    this.gamepad = new GamepadManager(this)
    this.multiplayer = false
    this.paused = false

    this.joystick1 = null
    this.joystick2 = null

    this.debug = new DebugOverlay(this, 10)

    this._boundKeyHandler = this._keyHandler.bind(this)
    this._boundDblClick = () => this.theme.nextTheme()

    this.settingsData = this.loadSettings()

    this._bindOverlayStart()
  }

  _emitLog(text, category = "info") {
    if (window.PONG_DEBUG !== false) console.log(text)
    window.dispatchEvent(new CustomEvent("pong-log", { detail: { text, category } }))
  }

  _bindOverlayStart() {
    if (this.overlayBtn) {
      this.overlayBtn.onclick = () => {
        if (this.state === "start" || this.state === "over") {
          this.startGame()
          this.hideOverlay()
        }
      }
    }
  }

  init() {
    // apply persisted settings before entity setup
    this.applyLoadedSettings()

    this.setupEntities()

    // create input manager with the full game object (so it can access players)
    this.input = new InputManager(this)

    this._setupMobileControls()

    this.canvas.addEventListener("dblclick", this._boundDblClick)
    document.addEventListener("keydown", this._boundKeyHandler)

    // ensure Start button counts as user gesture for audio autoplay
    if (this.overlayBtn) {
      this.overlayBtn.addEventListener(
        "click",
        () => {
          try {
            if (!this.audio.muted) this.audio.playMusic(this.theme.getCurrent().music)
          } catch (e) {}
        },
        { once: true },
      )
    }

    this.showStartScreen()
    requestAnimationFrame((ts) => this.loop(ts))
  }

  _keyHandler(e) {
    if (this.settings && this.settings.isOpen) {
      // Only allow closing the menu with O or Escape
      if (e.key === "o" || e.key === "O" || e.key === "Escape") {
        this.settings.toggle()
      }
      return
    }

    if (["ArrowUp", "ArrowDown", "w", "W", "s", "S"].includes(e.key) && document.activeElement === this.canvas) {
      e.preventDefault()
    }
    if (e.key === "m" || e.key === "M") {
      this.audio.toggleMute()
      this.saveSettings()
    }
    if (e.key === "Tab") {
      this.toggleMultiplayer()
      e.preventDefault()
    }
    if (e.key === "c" || e.key === "C") {
      this.customization.nextPaddle()
      this.customization.nextBall()
      // Apply new skins to existing entities
      if (this.players && this.players.length > 0) {
        this.players[0].color = this.customization.getPaddle().color
      }
      if (this.balls && this.balls.length > 0) {
        this.balls[0].color = this.customization.getBall().color
      }
      this.saveSettings()
    }
    if (e.key === "p" || e.key === "P" || e.key === "Escape") this.togglePause()
    if (e.key === "o" || e.key === "O") {
      this.settings.toggle()
      if (this.settings.isOpen && this.state === "playing") {
        this.paused = true
      }
    }
    if (e.key === "?") this.tutorial.start()
    if (e.key === "r" || e.key === "R") this.showReplay()
  }

  applyLoadedSettings() {
    const s = this.settingsData || {}
    if (s.themeIndex !== undefined) this.theme.applyTheme(s.themeIndex)
    if (s.difficultyIndex !== undefined) this.difficulty.set(s.difficultyIndex)
    if (s.paddleIndex !== undefined) this.customization.selectedPaddle = s.paddleIndex
    if (s.ballIndex !== undefined) this.customization.selectedBall = s.ballIndex
    if (s.muted !== undefined) {
      if (s.muted !== this.audio.muted) this.audio.toggleMute()
    }
    if (s.multiplayer !== undefined) this.multiplayer = !!s.multiplayer
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  saveSettings() {
    const s = {
      themeIndex: this.theme.currentIndex,
      difficultyIndex: this.difficulty.selected,
      paddleIndex: this.customization.selectedPaddle,
      ballIndex: this.customization.selectedBall,
      muted: !!this.audio.muted,
      multiplayer: !!this.multiplayer,
    }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
    } catch (e) {}
  }

  setupEntities() {
    // apply difficulty values for entity creation
    const ballSpeed =
      this.difficulty && typeof this.difficulty.getBallSpeed === "function" ? this.difficulty.getBallSpeed() : 6
    const paddleSpeed =
      this.difficulty && typeof this.difficulty.getPaddleSpeed === "function" ? this.difficulty.getPaddleSpeed() : 6

    const paddleSkin = this.customization.getPaddle()
    const ballSkin = this.customization.getBall()

    this.players = [
      new Paddle(16, this.canvas.height / 2 - 48, 16, 96, paddleSkin.color, "player1"),
      new Paddle(
        this.canvas.width - 32,
        this.canvas.height / 2 - 48,
        16,
        96,
        "#ff2d55",
        this.multiplayer ? "player2" : "ai",
      ),
    ]

    // apply paddle speed from difficulty
    this.players.forEach((p) => {
      p.speed = paddleSpeed
    })

    this.balls = [new Ball(this.canvas.width / 2, this.canvas.height / 2, 13, ballSkin.color, ballSpeed)]
    this.powerUps = []
    this.obstacles = [
      new Obstacle(this.canvas.width / 2 - 22, this.canvas.height / 2 - 60, 44, 44, "block", (t, bx, by) => ({
        y: by + Math.sin(t / 300) * 110,
      })),
    ]
    this.scoreBoard.reset()
    this.achievements.reset()
    this.analytics.reset()
    this.replay.reset()
  }

  loop(ts) {
    const dt = (ts - this.lastTimestamp) / 1000 || 0
    this.lastTimestamp = ts

    if (this.replay.isReplaying) {
      const state = this.replay.stepReplay()
      if (state) this.drawReplayFrame(state)
      requestAnimationFrame((ts) => this.loop(ts))
      return
    }

    if (this.state === "playing" && !this.paused) this.update(dt, ts)
    this.draw(ts)

    requestAnimationFrame((ts) => this.loop(ts))
  }

  update(dt, ts) {
    for (const paddle of this.players) paddle.update(dt, this)
    for (const ball of this.balls) ball.update(dt, this)

    // Power-ups spawn/update
    if (Math.random() < dt * 0.12 && this.powerUps.length < 2) {
      const types = ["enlarge", "shrink", "multi", "slow", "speed", "invisible"]
      const px = Math.random() * (this.canvas.width - 120) + 60
      const py = Math.random() * (this.canvas.height - 120) + 60
      const type = types[Math.floor(Math.random() * types.length)]
      this.powerUps.push(new PowerUp(type, px, py))
      this._emitLog(`PowerUp spawned: ${type} @ (${Math.round(px)}, ${Math.round(py)})`, "powerup")
    }
    for (const pu of this.powerUps) pu.update(dt, this)

    // Ball-powerup collision & activation
    for (const ball of this.balls) {
      for (const pu of this.powerUps) {
        for (const paddle of this.players) {
          if (!pu.active && pu.checkCollision(paddle)) {
            pu.activate(this, paddle)
            this.audio.play("score")
            this.particles.spawn(paddle.x + paddle.width / 2, paddle.y + paddle.height / 2, "#fff", 14, 6, 10, 0.8)
            this.analytics.powerUp()
            this._emitLog(`PowerUp activated: ${pu.type} by ${paddle.type}`, "powerup")
          }
        }
      }
    }
    this.powerUps = this.powerUps.filter((pu) => !pu.active)

    // Obstacles
    for (const ob of this.obstacles) ob.update(dt, ts)
    for (const ball of this.balls) {
      for (const ob of this.obstacles) {
        if (ob.checkCollision(ball)) {
          if (ball.velocityX > 0) ball.x = ob.x - ball.radius - 1
          else ball.x = ob.x + ob.width + ball.radius + 1
          ball.velocityX *= -1
          ball.velocityY *= -1
          this.audio.play("wall")
          this.particles.spawn(ball.x, ball.y, "#ffd200", 24, 9, 8, 0.7)
        }
      }
    }

    // Replay recording: keep recent frames when rally > 1
    if (this.analytics && this.analytics.rally > 1) {
      try {
        this.replay.record({
          players: this.players.map((p) => ({ x: p.x, y: p.y, width: p.width, height: p.height, color: p.color })),
          balls: this.balls.map((b) => ({ x: b.x, y: b.y, radius: b.radius, color: b.color })),
          powerUps: this.powerUps.map((pu) => ({ x: pu.x, y: pu.y, radius: pu.radius, color: pu.color })),
          obstacles: this.obstacles.map((ob) => ({ x: ob.x, y: ob.y, width: ob.width, height: ob.height })),
          score: { ...this.scoreBoard.scores },
        })
      } catch (e) {}
    }

    if (this.analytics.longestRally >= 10) this.achievements.unlock("rally10")
    if (this.analytics.powerUps >= 5) this.achievements.unlock("power5")
    if (this.analytics.multiBallScores > 0) this.achievements.unlock("multiball")

    this.achievements.update(dt)
    this.particles.update(dt)
  }

  draw(ts) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (typeof this.drawBackground === "function") {
      try {
        this.drawBackground()
      } catch (e) {
        console.warn("drawBackground() failed", e)
        this._drawSimpleBackground()
      }
    } else {
      this._drawSimpleBackground()
    }

    if (typeof this.drawNet === "function") {
      try {
        this.drawNet()
      } catch (e) {
        console.warn("drawNet() failed", e)
        this._drawSimpleNet()
      }
    } else {
      this._drawSimpleNet()
    }

    for (const paddle of this.players) paddle.draw(this.ctx)
    for (const ball of this.balls) ball.draw(this.ctx)
    for (const pu of this.powerUps) pu.draw(this.ctx)
    for (const ob of this.obstacles) ob.draw(this.ctx)
    this.particles.draw(this.ctx)
    this.scoreBoard.draw(this.ctx, this.canvas)
    if (this.highScores) this.highScores.draw(this.ctx, this.canvas, this.scoreBoard.mode)
    this.analytics.draw(this.ctx, this.canvas)
    this.achievements.draw(this.ctx, this.canvas)
  }

  _drawSimpleBackground() {
    const g = this.ctx
    g.save()
    g.fillStyle = "#1b1b1b"
    g.fillRect(0, 0, this.canvas.width, this.canvas.height)
    const grad = g.createLinearGradient(0, 0, this.canvas.width, this.canvas.height)
    grad.addColorStop(0, "#0f1720")
    grad.addColorStop(1, "#1b1b1b")
    g.fillStyle = grad
    g.globalAlpha = 0.7
    g.fillRect(0, 0, this.canvas.width, this.canvas.height)
    g.restore()
  }

  _drawSimpleNet() {
    const g = this.ctx
    g.save()
    g.strokeStyle = "#555"
    g.lineWidth = 3
    g.setLineDash([18, 14])
    g.beginPath()
    g.moveTo(this.canvas.width / 2, 0)
    g.lineTo(this.canvas.width / 2, this.canvas.height)
    g.stroke()
    g.setLineDash([])
    g.restore()
  }

  onScore(winner) {
    this._emitLog(`Score: winner=${winner} | beforeScores=${JSON.stringify(this.scoreBoard.scores)}`, "score")

    const lastFrames = this.replay.frames.slice()
    if (lastFrames.length > 0) {
      try {
        this.replay.saveLast(lastFrames)
      } catch {}
      const currentLen = this.analytics.longestRally || 0
      try {
        const savedBestLen = this.replay.getBestLength()
        if (currentLen >= savedBestLen) this.replay.saveBest(lastFrames, currentLen)
      } catch {}
    }

    this.scoreBoard.addScore(winner, 1)
    this._emitLog(`Score updated: winner=${winner} | afterScores=${JSON.stringify(this.scoreBoard.scores)}`, "score")
    this.audio.play("score")
    if (this.analytics) this.analytics.miss()
    const p = winner === "player1" ? this.players[0] : this.players[1] || this.players[1]
    if (p) this.particles.spawn(p.x + p.width / 2, p.y + p.height / 2, "#fff", 20, 6, 8, 0.9)

    const ws = this.scoreBoard.winningScore || 7
    const p1 = this.scoreBoard.scores.player1 || 0
    const p2 = this.scoreBoard.scores.player2 || 0
    if (p1 >= ws || p2 >= ws) {
      try {
        this.highScores.save(this.scoreBoard.mode, p1)
      } catch {}
      this.endGame()
    } else {
      this.resetPositions()
    }
    this.saveSettings()
  }

  resetPositions() {
    if (this.players && this.players.length >= 2) {
      this.players[0].y = this.canvas.height / 2 - this.players[0].height / 2
      this.players[1].y = this.canvas.height / 2 - this.players[1].height / 2
    }
    const ballSkin = this.customization.getBall()
    const ballSpeed = this.difficulty && this.difficulty.getBallSpeed ? this.difficulty.getBallSpeed() : 6
    this.balls = [new Ball(this.canvas.width / 2, this.canvas.height / 2, 13, ballSkin.color, ballSpeed)]
    this.replay.reset()
  }

  endGame() {
    this.state = "over"
    const p1 = this.scoreBoard.scores.player1 || 0
    const p2 = this.scoreBoard.scores.player2 || 0
    const youWin = p1 > p2
    const title = youWin ? "You Win! 🏆" : "Opponent Wins! 🤖"
    const bestLen = this.replay.getBestLength()
    const replayBtn = this.replay.hasLast() ? `<button id="play-last-rally">Play Last Rally</button>` : ""
    const bestBtn = bestLen > 0 ? `<button id="play-best-rally">Play Best Rally (${bestLen} hits)</button>` : ""
    this.showOverlay(
      title,
      `Final Score:<br><b>You</b>: ${p1} &nbsp;&nbsp; <b>Opponent</b>: ${p2}<br><br>
       ${replayBtn} ${bestBtn}
       <div style="margin-top:8px"><i>Click Restart to play again</i></div>`,
      "Restart",
    )
    this.overlayBtn.onclick = () => {
      this.startGame()
      this.hideOverlay()
      this._bindOverlayStart()
    }
    setTimeout(() => {
      const lastBtn = document.getElementById("play-last-rally")
      if (lastBtn)
        lastBtn.onclick = () => {
          const f = this.replay.getLast()
          if (f) {
            this.replay.startReplayFromFrames(f)
          }
        }
      const bestBtnEl = document.getElementById("play-best-rally")
      if (bestBtnEl)
        bestBtnEl.onclick = () => {
          const f = this.replay.getBest()
          if (f) {
            this.replay.startReplayFromFrames(f)
          }
        }
    }, 100)
  }

  drawReplayFrame(state) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (typeof this.drawBackground === "function") {
      try {
        this.drawBackground()
      } catch (e) {
        this._drawSimpleBackground()
      }
    } else this._drawSimpleBackground()

    if (typeof this.drawNet === "function") {
      try {
        this.drawNet()
      } catch (e) {
        this._drawSimpleNet()
      }
    } else this._drawSimpleNet()

    for (const paddle of state.players) {
      this.ctx.save()
      this.ctx.fillStyle = paddle.color
      this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height)
      this.ctx.restore()
    }
    for (const ball of state.balls) {
      this.ctx.save()
      this.ctx.fillStyle = ball.color
      this.ctx.beginPath()
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.restore()
    }
  }

  showReplay() {
    if (this.replay.frames.length > 0) {
      this._emitLog(`Starting replay playback, frames=${this.replay.frames.length}`, "info")
      this.replay.startReplay()
    }
  }

  togglePause() {
    this.paused = !this.paused
    if (this.paused) this.audio.play("wall")
  }

  toggleMultiplayer() {
    this.multiplayer = !this.multiplayer
    try {
      if (this.online && typeof this.online.stop === "function") this.online.stop()
    } catch (e) {}
    this.setupEntities()
    // recreate input manager so it binds to updated players
    try {
      if (this.input && typeof this.input.stop === "function") this.input.stop()
    } catch (e) {}
    this.input = new InputManager(this)

    this._updateMobileControls()

    this.saveSettings()
  }

  _setupMobileControls() {
    // Only show on touch devices
    if (!("ontouchstart" in window)) return

    const rect = this.canvas.getBoundingClientRect()
    const canvasBottom = rect.top + rect.height

    // Player 1 joystick (left side)
    this.joystick1 = new TouchJoystick(this, {
      playerIndex: 0,
      width: 80,
      height: 200,
      x: 20,
      y: canvasBottom - 220,
    })

    // Player 2 joystick (right side) - only in multiplayer
    if (this.multiplayer) {
      this.joystick2 = new TouchJoystick(this, {
        playerIndex: 1,
        width: 80,
        height: 200,
        x: window.innerWidth - 100,
        y: canvasBottom - 220,
      })
    }
  }

  _updateMobileControls() {
    if (!("ontouchstart" in window)) return

    // Destroy existing joysticks
    if (this.joystick1) {
      this.joystick1.destroy()
      this.joystick1 = null
    }
    if (this.joystick2) {
      this.joystick2.destroy()
      this.joystick2 = null
    }

    // Recreate based on current mode
    this._setupMobileControls()
  }

  showOverlay(title, desc, btnText) {
    this.overlay.classList.remove("hidden")
    this.overlayTitle.textContent = title
    this.overlayDesc.innerHTML = desc
    this.overlayBtn.textContent = btnText || "Start"
    this.overlay.setAttribute("role", "dialog")
    this.overlayBtn.setAttribute("aria-label", btnText || "Start")
  }
  hideOverlay() {
    this.overlay.classList.add("hidden")
    this.overlay.removeAttribute("role")
  }
  showStartScreen() {
    this.showOverlay(
      "Ultimate Pong",
      `<b>Controls:</b><br>
      <span style="color:#43e97b">Mouse</span>: Move paddle<br>
      <span style="color:#43e97b">Touch</span>: Drag paddle<br>
      <span style="color:#43e97b">Keyboard</span>: W/S or ↑/↓ for P1, Tab for local multiplayer, C to cycle skins<br>
      <span style="color:#43e97b">M</span>: Toggle Mute<br>
      <span style="color:#43e97b">Double Click Canvas</span>: Change Theme<br><br>
      <span style="color:#aaa;font-size:0.98em">Tip: Ball gets faster as you play.<br>AI gets tougher!<br>Power-ups, obstacles, and multiplayer await!</span>`,
      "Start",
    )
  }

  startGame() {
    this.state = "playing"
    // recreate entities with difficulty applied
    this.setupEntities()
    try {
      if (!this.audio.muted) this.audio.playMusic(this.theme.getCurrent().music)
    } catch (e) {}
    this.saveSettings()
  }

  destroy() {
    try {
      if (this.online && typeof this.online.stop === "function") this.online.stop()
    } catch (e) {}
    try {
      if (this.gamepad && typeof this.gamepad.stop === "function") this.gamepad.stop()
    } catch (e) {}
    try {
      if (this.joystick1) this.joystick1.destroy()
      if (this.joystick2) this.joystick2.destroy()
    } catch (e) {}
    try {
      document.removeEventListener("keydown", this._boundKeyHandler)
      this.canvas.removeEventListener("dblclick", this._boundDblClick)
    } catch (e) {}
    try {
      if (this.input && typeof this.input.stop === "function") this.input.stop()
    } catch (e) {}
    try {
      this.replay.reset()
    } catch (e) {}
    try {
      this.audio.stopMusic()
    } catch (e) {}
  }
}

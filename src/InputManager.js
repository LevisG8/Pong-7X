// InputManager.js - robust keyboard + mouse + touch handler.
// Listens on document/window and updates player paddles' moveUp/moveDown flags.
// Construct with new InputManager(game). Call stop() to remove listeners.
export default class InputManager {
  constructor(game) {
    this.game = game
    this.canvas = game.canvas
    this.players = game.players

    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this._onMouseMove = this._onMouseMove.bind(this)
    this._onTouchMove = this._onTouchMove.bind(this)
    this._onBlur = this._onBlur.bind(this)

    this._bind()
  }

  _bind() {
    // Keyboard (global) - avoids needing canvas focus
    window.addEventListener("keydown", this._onKeyDown, { passive: false })
    window.addEventListener("keyup", this._onKeyUp, { passive: false })
    window.addEventListener("blur", this._onBlur)

    // Mouse move over canvas for direct control of player1
    if (this.canvas) {
      this.canvas.addEventListener("mousemove", this._onMouseMove, { passive: true })
      // Touch
      this.canvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false })
      this.canvas.addEventListener("touchmove", this._onTouchMove, { passive: false })
    }
  }

  _onKeyDown(e) {
    if (this.game.settings && this.game.settings.isOpen) {
      return
    }

    // prevent page scroll for arrow keys when using canvas
    if (["ArrowUp", "ArrowDown", "Tab", "w", "W", "s", "S"].includes(e.key)) {
      e.preventDefault()
    }
    // Player1: W/S
    const p1 = this.game.players[0]
    const p2 = this.game.players[1]
    if (!p1) return

    if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
      p1.moveUp = true
      p1.moveDown = false
      if (this.game.online && this.game.online.connected) {
        this.game.online.sendInput({ up: true, down: false, y: p1.y })
      }
    } else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
      p1.moveDown = true
      p1.moveUp = false
      if (this.game.online && this.game.online.connected) {
        this.game.online.sendInput({ up: false, down: true, y: p1.y })
      }
    } else if (e.key === "Tab") {
      // toggle local multiplayer
      this.game.toggleMultiplayer()
    } else if (e.key === "PageUp") {
      // optional: increase difficulty
      this.game.difficulty.next()
      this.game.saveSettings()
    } else if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && p2) {
      p2.moveUp = true
      p2.moveDown = false
    } else if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && p2) {
      p2.moveDown = true
      p2.moveUp = false
    }
  }

  _onKeyUp(e) {
    if (this.game.settings && this.game.settings.isOpen) {
      return
    }

    const p1 = this.game.players[0]
    const p2 = this.game.players[1]
    if (!p1) return

    if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
      p1.moveUp = false
      if (this.game.online && this.game.online.connected) {
        this.game.online.sendInput({ up: false, y: p1.y })
      }
    }
    if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
      p1.moveDown = false
      if (this.game.online && this.game.online.connected) {
        this.game.online.sendInput({ down: false, y: p1.y })
      }
    }
    if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && p2) p2.moveUp = false
    if ((e.key === "ArrowRight" || e.key === "d" || e.key === "D") && p2) p2.moveDown = false
  }

  _onMouseMove(e) {
    if (this.game.settings && this.game.settings.isOpen) {
      return
    }
    if (!this.canvas || !this.game.players[0]) return
    const rect = this.canvas.getBoundingClientRect()
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height)
    const paddle = this.game.players[0]
    paddle.y = Math.max(0, Math.min(this.canvas.height - paddle.height, y - paddle.height / 2))

    if (this.game.online && this.game.online.connected) {
      this.game.online.sendInput({ y: paddle.y })
    }
  }

  _onTouchMove(e) {
    if (this.game.settings && this.game.settings.isOpen) {
      return
    }
    if (!this.canvas || !this.game.players[0]) return
    const t = e.touches[0]
    if (!t) return
    const rect = this.canvas.getBoundingClientRect()
    const y = (t.clientY - rect.top) * (this.canvas.height / rect.height)
    const paddle = this.game.players[0]
    paddle.y = Math.max(0, Math.min(this.canvas.height - paddle.height, y - paddle.height / 2))

    if (this.game.online && this.game.online.connected) {
      this.game.online.sendInput({ y: paddle.y })
    }

    e.preventDefault()
  }

  _onBlur() {
    // Release keys on blur to avoid stuck inputs
    if (this.game.players && this.game.players.length > 0) {
      for (const p of this.game.players) {
        p.moveUp = false
        p.moveDown = false
      }
    }
  }

  stop() {
    window.removeEventListener("keydown", this._onKeyDown)
    window.removeEventListener("keyup", this._onKeyUp)
    window.removeEventListener("blur", this._onBlur)
    if (this.canvas) {
      this.canvas.removeEventListener("mousemove", this._onMouseMove)
      this.canvas.removeEventListener("touchmove", this._onTouchMove)
    }
  }
}

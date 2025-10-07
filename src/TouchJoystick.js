export default class TouchJoystick {
  constructor(game, options = {}) {
    this.game = game
    this.canvas = game.canvas
    this.playerIndex = options.playerIndex || 0
    this.width = options.width || 80
    this.height = options.height || 200
    this.x = options.x || 20
    this.y = options.y || window.innerHeight - this.height - 20

    this.container = document.createElement("div")
    this.container.id = `touch-joystick-p${this.playerIndex + 1}`
    Object.assign(this.container.style, {
      position: "fixed",
      left: `${this.x}px`,
      top: `${this.y}px`,
      width: `${this.width}px`,
      height: `${this.height}px`,
      borderRadius: "16px",
      background: "linear-gradient(135deg, rgba(67, 233, 123, 0.15), rgba(56, 249, 215, 0.15))",
      backdropFilter: "blur(10px)",
      border: "2px solid rgba(67, 233, 123, 0.3)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(67, 233, 123, 0.1)",
      zIndex: 9998,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      touchAction: "none",
      userSelect: "none",
      transition: "all 0.2s ease",
    })

    // Up arrow indicator
    this.upArrow = document.createElement("div")
    this.upArrow.innerHTML = "▲"
    Object.assign(this.upArrow.style, {
      fontSize: "24px",
      color: "rgba(255, 255, 255, 0.4)",
      marginBottom: "8px",
      transition: "all 0.15s ease",
      pointerEvents: "none",
    })

    // Thumb/handle
    this.thumb = document.createElement("div")
    Object.assign(this.thumb.style, {
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, rgba(67, 233, 123, 0.6), rgba(56, 249, 215, 0.6))",
      border: "3px solid rgba(255, 255, 255, 0.5)",
      boxShadow: "0 4px 16px rgba(67, 233, 123, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.3)",
      transform: "translateY(0px)",
      transition: "box-shadow 0.15s ease",
      pointerEvents: "none",
    })

    // Down arrow indicator
    this.downArrow = document.createElement("div")
    this.downArrow.innerHTML = "▼"
    Object.assign(this.downArrow.style, {
      fontSize: "24px",
      color: "rgba(255, 255, 255, 0.4)",
      marginTop: "8px",
      transition: "all 0.15s ease",
      pointerEvents: "none",
    })

    this.container.appendChild(this.upArrow)
    this.container.appendChild(this.thumb)
    this.container.appendChild(this.downArrow)
    document.body.appendChild(this.container)

    this.active = false
    this.startY = null
    this.offsetY = 0

    this._bind()

    // Hide if not mobile
    if (!("ontouchstart" in window)) this.hide()
  }

  _bind() {
    this.container.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault()
        const t = e.touches[0]
        this.active = true
        this.startY = t.clientY
        this.offsetY = 0
        // Visual feedback
        this.container.style.background = "linear-gradient(135deg, rgba(67, 233, 123, 0.25), rgba(56, 249, 215, 0.25))"
        this.thumb.style.boxShadow = "0 6px 24px rgba(67, 233, 123, 0.8), inset 0 2px 8px rgba(255, 255, 255, 0.4)"
      },
      { passive: false },
    )

    this.container.addEventListener(
      "touchmove",
      (e) => {
        if (!this.active) return
        e.preventDefault()
        const t = e.touches[0]
        this.offsetY = t.clientY - this.startY

        // Clamp offset to visual range
        const max = this.height / 2 - 40
        const o = Math.max(-max, Math.min(max, this.offsetY))
        this.thumb.style.transform = `translateY(${o}px)`

        // Highlight arrows based on direction
        if (o < -10) {
          this.upArrow.style.color = "rgba(67, 233, 123, 1)"
          this.upArrow.style.transform = "scale(1.2)"
          this.downArrow.style.color = "rgba(255, 255, 255, 0.4)"
          this.downArrow.style.transform = "scale(1)"
        } else if (o > 10) {
          this.downArrow.style.color = "rgba(67, 233, 123, 1)"
          this.downArrow.style.transform = "scale(1.2)"
          this.upArrow.style.color = "rgba(255, 255, 255, 0.4)"
          this.upArrow.style.transform = "scale(1)"
        } else {
          this.upArrow.style.color = "rgba(255, 255, 255, 0.4)"
          this.downArrow.style.color = "rgba(255, 255, 255, 0.4)"
          this.upArrow.style.transform = "scale(1)"
          this.downArrow.style.transform = "scale(1)"
        }

        // Map offset to paddle position
        const norm = -o / max // -1 (up) to 1 (down)
        const paddle = this.game.players[this.playerIndex]
        if (paddle) {
          const centerY = this.canvas.height / 2 + norm * (this.canvas.height / 3)
          paddle.y = Math.max(0, Math.min(this.canvas.height - paddle.height, centerY - paddle.height / 2))
        }
      },
      { passive: false },
    )

    this.container.addEventListener(
      "touchend",
      (e) => {
        this.active = false
        this.startY = null
        this.offsetY = 0
        this.thumb.style.transform = "translateY(0px)"
        this.upArrow.style.color = "rgba(255, 255, 255, 0.4)"
        this.downArrow.style.color = "rgba(255, 255, 255, 0.4)"
        this.upArrow.style.transform = "scale(1)"
        this.downArrow.style.transform = "scale(1)"
        this.container.style.background = "linear-gradient(135deg, rgba(67, 233, 123, 0.15), rgba(56, 249, 215, 0.15))"
        this.thumb.style.boxShadow = "0 4px 16px rgba(67, 233, 123, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.3)"
      },
      { passive: false },
    )
  }

  show() {
    this.container.style.display = "flex"
  }
  hide() {
    this.container.style.display = "none"
  }
  destroy() {
    try {
      this.container.remove()
    } catch (e) {}
  }
}

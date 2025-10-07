import { createHostFlow, createJoinFlow } from "./SignalingHelperUI.js"

export default class SettingsMenu {
  constructor(game) {
    this.game = game
    this.node = null
    this.visible = false
    this.isOpen = false
    this.build()
  }

  build() {
    if (!this.node) {
      this.node = document.createElement("div")
      Object.assign(this.node.style, {
        position: "fixed",
        top: "60px",
        right: "40px",
        background: "linear-gradient(135deg, rgba(35, 37, 38, 0.98), rgba(30, 30, 30, 0.98))",
        padding: "20px",
        borderRadius: "16px",
        zIndex: 999,
        color: "#fff",
        fontFamily: "Segoe UI, Arial",
        display: "none",
        width: "380px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(67, 233, 123, 0.2)",
        backdropFilter: "blur(10px)",
      })
      document.body.appendChild(this.node)
    }

    const debugLabel = this.game.debug && this.game.debug.visible ? "Hide Debug" : "Show Debug"

    this.node.innerHTML = `
      <div style="font-weight:bold;margin-bottom:12px;font-size:1.2em;color:#43e97b">⚙️ Settings</div>
      
      <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
        <span>Difficulty:</span>
        <button id="diff-btn" aria-label="Change difficulty" style="padding:6px 12px;border-radius:8px;border:none;background:#43e97b;color:#111;font-weight:600;cursor:pointer">${this.game.difficulty.getCurrent().name}</button>
      </div>
      
      <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
        <span>Theme:</span>
        <button id="theme-btn" aria-label="Change theme" style="padding:6px 12px;border-radius:8px;border:none;background:#43e97b;color:#111;font-weight:600;cursor:pointer">${this.game.theme.getCurrent().name}</button>
      </div>
      
      <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
        <span>Sound:</span>
        <button id="mute-btn" aria-label="Toggle sound" style="padding:6px 12px;border-radius:8px;border:none;background:${this.game.audio.muted ? "#ff4444" : "#43e97b"};color:#111;font-weight:600;cursor:pointer">${this.game.audio.muted ? "🔇 Off" : "🔊 On"}</button>
      </div>
      
      <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
        <span>Local Multiplayer:</span>
        <button id="multi-btn" aria-label="Toggle local multiplayer" style="padding:6px 12px;border-radius:8px;border:none;background:${this.game.multiplayer ? "#43e97b" : "#666"};color:#111;font-weight:600;cursor:pointer">${this.game.multiplayer ? "✓ On" : "Off"}</button>
      </div>
      
      <hr style="border:0;margin:12px 0;border-top:1px solid rgba(67, 233, 123, 0.2)">
      
      <div style="font-weight:bold;margin-bottom:8px;color:#38f9d7">🎵 Custom Music</div>
      <div style="margin-bottom:10px">
        <input type="file" id="music-file" accept="audio/*" aria-label="Upload custom music" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(67, 233, 123, 0.3);background:#1a1a1a;color:#fff;font-size:0.9em" />
        <div style="margin-top:4px;font-size:0.85em;color:#aaa">Upload MP3, WAV, or OGG</div>
      </div>
      
      <hr style="border:0;margin:12px 0;border-top:1px solid rgba(67, 233, 123, 0.2)">
      
      <div style="font-weight:bold;margin-bottom:8px;color:#38f9d7">🌐 Online Multiplayer</div>
      <div style="margin-bottom:10px;display:flex;gap:8px">
        <button id="host-btn" aria-label="Host online game" style="flex:1;padding:8px;border-radius:8px;border:none;background:#38f9d7;color:#111;font-weight:600;cursor:pointer">🎮 Host</button>
        <button id="join-btn" aria-label="Join online game" style="flex:1;padding:8px;border-radius:8px;border:none;background:#38f9d7;color:#111;font-weight:600;cursor:pointer">🔗 Join</button>
      </div>
      
      <div style="margin-bottom:10px">
        <input id="server-url" aria-label="Signaling server URL" placeholder="Optional: ws://host:port" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(67, 233, 123, 0.3);background:#1a1a1a;color:#fff;font-size:0.9em" />
        <button id="server-btn" aria-label="Connect signaling server" style="margin-top:6px;width:100%;padding:8px;border-radius:8px;border:none;background:#666;color:#fff;font-weight:600;cursor:pointer">Connect Server</button>
      </div>
      
      <hr style="border:0;margin:12px 0;border-top:1px solid rgba(67, 233, 123, 0.2)">
      
      <div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
        <span>Debug Overlay:</span>
        <button id="debug-btn" aria-label="Toggle debug overlay" style="padding:6px 12px;border-radius:8px;border:none;background:#666;color:#fff;font-weight:600;cursor:pointer">${debugLabel}</button>
      </div>
      
      <div style="text-align:right;margin-top:16px">
        <button id="close-btn" aria-label="Close settings" style="padding:10px 24px;border-radius:8px;border:none;background:linear-gradient(90deg, #43e97b, #38f9d7);color:#111;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(67, 233, 123, 0.3)">Close</button>
      </div>
      
      <div id="online-area" style="margin-top:16px"></div>
    `

    // Button handlers
    this.node.querySelector("#diff-btn").onclick = () => {
      this.game.difficulty.next()
      this.game.saveSettings()
      this.build()
    }

    this.node.querySelector("#theme-btn").onclick = () => {
      this.game.theme.nextTheme()
      this.game.saveSettings()
      this.build()
    }

    this.node.querySelector("#mute-btn").onclick = () => {
      this.game.audio.toggleMute()
      this.game.saveSettings()
      this.build()
    }

    this.node.querySelector("#multi-btn").onclick = () => {
      this.game.toggleMultiplayer()
      this.game.saveSettings()
      this.build()
    }

    this.node.querySelector("#debug-btn").onclick = () => {
      if (this.game.debug) {
        this.game.debug.toggle()
        this.build()
      }
    }

    this.node.querySelector("#music-file").onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const url = URL.createObjectURL(file)
        this.game.audio.stopMusic()
        this.game.audio.playMusic(url)
        alert(`✓ Playing: ${file.name}`)
      } catch (err) {
        alert("Failed to load music file. Check console.")
        console.error("Music upload error:", err)
      }
    }

    // Host button
    this.node.querySelector("#host-btn").onclick = async () => {
      const onlineArea = this.node.querySelector("#online-area")
      onlineArea.innerHTML = ""
      if (!this.game.online) {
        const Online = (await import("./OnlineMultiplayer.js")).default
        this.game.online = new Online(this.game, null)
        this.game.online.onRemoteInput = (input) => {
          if (this.game.players[1]) {
            if (typeof input.y === "number") this.game.players[1].y = input.y
            if (input.up !== undefined) this.game.players[1].moveUp = !!input.up
            if (input.down !== undefined) this.game.players[1].moveDown = !!input.down
          }
        }
      }
      createHostFlow(onlineArea, this.game.online)
    }

    // Join button
    this.node.querySelector("#join-btn").onclick = async () => {
      const onlineArea = this.node.querySelector("#online-area")
      onlineArea.innerHTML = ""
      if (!this.game.online) {
        const Online = (await import("./OnlineMultiplayer.js")).default
        this.game.online = new Online(this.game, null)
        this.game.online.onRemoteInput = (input) => {
          if (this.game.players[0]) {
            if (typeof input.y === "number") this.game.players[0].y = input.y
            if (input.up !== undefined) this.game.players[0].moveUp = !!input.up
            if (input.down !== undefined) this.game.players[0].moveDown = !!input.down
          }
        }
      }
      createJoinFlow(onlineArea, this.game.online)
    }

    // Signaling server
    this.node.querySelector("#server-btn").onclick = async () => {
      const url = this.node.querySelector("#server-url").value.trim()
      if (!url) return alert("Enter signaling server URL (ws://host:port)")
      const Online = (await import("./OnlineMultiplayer.js")).default
      if (this.game.online) {
        try {
          this.game.online.stop()
        } catch {}
      }
      this.game.online = new Online(this.game, url)
      this.game.online.onRemoteInput = (input) => {
        if (this.game.players[1] && typeof input.y === "number") this.game.players[1].y = input.y
      }
      alert("✓ Signaling client created")
    }

    this.node.querySelector("#close-btn").onclick = () => this.hide()
  }

  show() {
    this.build()
    this.node.style.display = "block"
    this.visible = true
    this.isOpen = true
  }
  hide() {
    this.node.style.display = "none"
    this.visible = false
    this.isOpen = false
  }
  toggle() {
    this.visible ? this.hide() : this.show()
  }
}

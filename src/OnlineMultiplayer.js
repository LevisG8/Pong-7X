// OnlineMultiplayer.js - Dual-mode: automatic signaling (WebSocket) OR manual SDP copy/paste.
// No server required for manual mode.
// - createManualOffer() -> returns full SDP string (includes ICE) to copy/paste to peer.
// - acceptManualOffer(offerSdp) -> returns answer SDP string to copy back to offerer.
// - acceptManualAnswer(answerSdp) -> finishes handshake for the offerer.
// - sendInput(input) sends via datachannel (or falls back to signaling server if present).
//
// Usage (manual):
// const om = new OnlineMultiplayer(game); // no signalingUrl needed
// const offer = await om.createManualOffer(); // host: copy offer -> send to peer
// const answer = await om.acceptManualOffer(offerFromHost); // joiner: returns answer -> send back to host
// await om.acceptManualAnswer(answerFromJoiner); // host: paste answer to complete
//
// Usage (auto-signaling):
// const om = new OnlineMultiplayer(game, 'ws://your-signaling-server:3000');
// await om.start(roomId);
export default class OnlineMultiplayer {
  constructor(game, signalingUrl = null) {
    this.game = game
    this.signalingUrl = signalingUrl
    this.ws = null
    this.pc = null
    this.dataChannel = null
    this.roomId = null
    this.connected = false
    this.onRemoteInput = null
    this.onConnect = null
    this.onDisconnect = null
    this._isInitiator = false
    this._iceQueue = []
    this.config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
    }
  }

  // --------- AUTOMATIC SIGNALING (optional) ----------
  async start(roomId) {
    if (!this.signalingUrl) {
      throw new Error("No signaling URL configured. Use manual mode or provide signalingUrl.")
    }
    this.roomId = roomId
    await this._connectSignaling()
    this._send({ type: "join", room: this.roomId })
  }

  stop() {
    try {
      if (this.dataChannel) this.dataChannel.close()
    } catch {}
    try {
      if (this.pc) this.pc.close()
    } catch {}
    try {
      if (this.ws) this.ws.close()
    } catch {}
    this.dataChannel = null
    this.pc = null
    this.ws = null
    this.connected = false
    if (typeof this.onDisconnect === "function") this.onDisconnect()
  }

  // --------- MANUAL SIGNALING MODE (no server) ----------
  // Host / Offerer: create offer and wait for ICE gathering to finish, returns SDP string
  async createManualOffer() {
    await this._createPeer(true)
    // create offer
    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)
    // wait for ICE gathering to complete, then return full SDP
    await this._waitForIceGatheringComplete()
    return this.pc.localDescription.sdp
  }

  // Joiner: accept remote offer SDP, create answer, return answer SDP
  async acceptManualOffer(remoteSdp) {
    await this._createPeer(false)
    const remoteDesc = { type: "offer", sdp: remoteSdp }
    await this.pc.setRemoteDescription(new RTCSessionDescription(remoteDesc))
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    await this._waitForIceGatheringComplete()
    return this.pc.localDescription.sdp
  }

  // Offerer: accept the answer SDP to finish handshake
  async acceptManualAnswer(answerSdp) {
    if (!this.pc) throw new Error("PeerConnection not initialized on offerer")
    const remoteDesc = { type: "answer", sdp: answerSdp }
    await this.pc.setRemoteDescription(new RTCSessionDescription(remoteDesc))
    // all done
    return true
  }

  // internal helper: create RTCPeerConnection and set up data channel handlers
  async _createPeer(isInitiator) {
    if (this.pc) return
    this.pc = new RTCPeerConnection(this.config)

    this.pc.onicecandidate = (e) => {
      if (e.candidate && this.signalingUrl && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this._send({ type: "ice", room: this.roomId, candidate: e.candidate })
      }
    }

    this.pc.onconnectionstatechange = () => {
      const s = this.pc.connectionState || this.pc.iceConnectionState
      if (s === "connected") {
        this.connected = true
        if (typeof this.onConnect === "function") this.onConnect()
      } else if (s === "disconnected" || s === "failed" || s === "closed") {
        this.connected = false
        if (typeof this.onDisconnect === "function") this.onDisconnect()
      }
    }

    if (isInitiator) {
      // create a data channel for driving inputs
      this.dataChannel = this.pc.createDataChannel("input", { ordered: true, maxRetransmits: 0 })
      this._setupDataChannel()
    } else {
      this.pc.ondatachannel = (e) => {
        this.dataChannel = e.channel
        this._setupDataChannel()
      }
    }

    // apply any queued ICE candidates (if any)
    if (this._iceQueue.length > 0) {
      for (const c of this._iceQueue) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(c))
        } catch (e) {}
      }
      this._iceQueue = []
    }
  }

  _setupDataChannel() {
    if (!this.dataChannel) return
    this.dataChannel.onopen = () => {
      this._log("Data channel open")
    }
    this.dataChannel.onclose = () => {
      this._log("Data channel closed")
    }
    this.dataChannel.onerror = (e) => {
      console.warn("Data channel error", e)
    }
    this.dataChannel.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        if (msg.type === "input" && typeof this.onRemoteInput === "function") {
          this.onRemoteInput(msg.input)
        }
      } catch (e) {}
    }
  }

  async _waitForIceGatheringComplete(timeout = 10000) {
    if (!this.pc) return
    if (this.pc.iceGatheringState === "complete") return
    return new Promise((resolve) => {
      const checkState = () => {
        if (!this.pc) return resolve()
        if (this.pc.iceGatheringState === "complete") {
          this.pc.removeEventListener("icegatheringstatechange", checkState)
          return resolve()
        }
      }
      this.pc.addEventListener("icegatheringstatechange", checkState)
      // fallback timeout
      setTimeout(() => {
        resolve()
      }, timeout)
    })
  }

  sendInput(input) {
    if (!this.connected) {
      console.warn("[OnlineMultiplayer] Not connected, cannot send input")
      return
    }

    // data channel preferred
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      try {
        this.dataChannel.send(JSON.stringify({ type: "input", input }))
      } catch (e) {
        console.warn("[OnlineMultiplayer] Failed to send via data channel:", e)
      }
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN && this.roomId) {
      // fallback to signaling server relay (not low-latency but works)
      this._send({ type: "input", room: this.roomId, input })
    }
  }

  // --------- OPTIONAL SIGNALLING SERVER (auto) ----------
  async _connectSignaling() {
    if (!this.signalingUrl) return
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.signalingUrl)
      this.ws.onopen = () => {
        this._log("Connected to signaling server")
        resolve()
      }
      this.ws.onerror = (e) => {
        console.warn("Signaling error", e)
        reject(e)
      }
      this.ws.onmessage = async (ev) => {
        let data
        try {
          data = JSON.parse(ev.data)
        } catch {
          return
        }
        await this._handleSignalingMessage(data)
      }
      this.ws.onclose = () => {
        this._log("Signaling closed")
      }
    })
  }

  _send(obj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    try {
      this.ws.send(JSON.stringify(obj))
    } catch (e) {}
  }

  async _handleSignalingMessage(msg) {
    const { type } = msg
    if (type === "joined") {
      const clients = msg.clients || 1
      this._isInitiator = clients > 1
      if (this._isInitiator) await this._createPeer(true)
      else await this._createPeer(false)
    } else if (type === "offer") {
      await this._createPeer(false)
      await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
      const answer = await this.pc.createAnswer()
      await this.pc.setLocalDescription(answer)
      this._send({ type: "answer", room: this.roomId, sdp: this.pc.localDescription })
    } else if (type === "answer") {
      if (!this.pc) return
      await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
    } else if (type === "ice") {
      if (!this.pc) {
        this._iceQueue.push(msg.candidate)
      } else {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate))
        } catch (e) {}
      }
    } else if (type === "input") {
      if (this.onRemoteInput) this.onRemoteInput(msg.input)
    }
  }

  _log(...args) {
    if (window.PONG_DEBUG !== false) console.log("[OnlineMultiplayer]", ...args)
    window.dispatchEvent(
      new CustomEvent("pong-log", { detail: { text: "[OnlineMultiplayer] " + args.join(" "), category: "info" } }),
    )
  }
}

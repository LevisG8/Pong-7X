import { showQRCode } from "./QRCodeHelper.js"

export function createHostFlow(container, onlineClient) {
  container.innerHTML = `
    <div style="background:rgba(56, 249, 215, 0.1);padding:16px;border-radius:12px;border:1px solid rgba(56, 249, 215, 0.3)">
      <div style="margin-bottom:10px;font-weight:600;color:#38f9d7;font-size:1.1em">🎮 Host Game</div>
      <div id="host-status" style="margin-bottom:10px;color:#ffd;font-size:0.9em">Creating offer...</div>
      <textarea id="host-offer" style="width:100%;height:120px;padding:8px;border-radius:8px;border:1px solid rgba(56, 249, 215, 0.3);background:#1a1a1a;color:#fff;font-family:monospace;font-size:0.85em;resize:vertical" readonly></textarea>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button id="host-copy" style="flex:1;padding:8px;border-radius:8px;border:none;background:#43e97b;color:#111;font-weight:600;cursor:pointer">📋 Copy</button>
        <button id="host-show-qr" style="flex:1;padding:8px;border-radius:8px;border:none;background:#38f9d7;color:#111;font-weight:600;cursor:pointer">📱 QR Code</button>
        <button id="host-paste-answer" style="flex:1;padding:8px;border-radius:8px;border:none;background:#ff9500;color:#111;font-weight:600;cursor:pointer">✓ Paste Answer</button>
      </div>
      <div id="host-qr-area" style="margin-top:12px;text-align:center"></div>
    </div>
  `

  const status = container.querySelector("#host-status")
  const offerTA = container.querySelector("#host-offer")
  const copyBtn = container.querySelector("#host-copy")
  const pasteBtn = container.querySelector("#host-paste-answer")
  const qrBtn = container.querySelector("#host-show-qr")
  const qrArea = container.querySelector("#host-qr-area")
  ;(async () => {
    try {
      status.textContent = "⏳ Creating offer and gathering ICE candidates..."
      const offerSdp = await onlineClient.createManualOffer()
      offerTA.value = offerSdp
      status.textContent = "✓ Offer ready! Send this to the other player."
      status.style.color = "#43e97b"
    } catch (e) {
      status.style.color = "#ff4444"
      status.textContent = "❌ Failed: " + (e && e.message ? e.message : e)
    }
  })()

  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(offerTA.value)
      status.textContent = "✓ Copied to clipboard!"
      status.style.color = "#43e97b"
    } catch {
      offerTA.select()
      status.textContent = "⚠️ Copy failed. Select and copy manually."
      status.style.color = "#ff9500"
    }
  }

  qrBtn.onclick = () => {
    if (!offerTA.value) return alert("No offer to create QR code.")
    showQRCode(qrArea, offerTA.value, { size: 280, label: "Scan to Join" })
  }

  pasteBtn.onclick = async () => {
    const answer = prompt("Paste the answer SDP from the other player:")
    if (!answer) return alert("Answer is required to complete connection.")
    status.textContent = "⏳ Applying answer..."
    status.style.color = "#ffd"
    try {
      await onlineClient.acceptManualAnswer(answer)
      status.textContent = "✓ Connected! Waiting for data channel..."
      status.style.color = "#43e97b"
    } catch (e) {
      console.error(e)
      status.style.color = "#ff4444"
      status.textContent = "❌ Failed to accept answer. Check console."
    }
  }
}

export function createJoinFlow(container, onlineClient) {
  container.innerHTML = `
    <div style="background:rgba(56, 249, 215, 0.1);padding:16px;border-radius:12px;border:1px solid rgba(56, 249, 215, 0.3)">
      <div style="margin-bottom:10px;font-weight:600;color:#38f9d7;font-size:1.1em">🔗 Join Game</div>
      <div id="join-status" style="margin-bottom:10px;color:#ffd;font-size:0.9em">Paste the host's offer below</div>
      <textarea id="join-offer" style="width:100%;height:100px;padding:8px;border-radius:8px;border:1px solid rgba(56, 249, 215, 0.3);background:#1a1a1a;color:#fff;font-family:monospace;font-size:0.85em;resize:vertical" placeholder="Paste host's offer SDP here..."></textarea>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button id="join-create-answer" style="flex:1;padding:8px;border-radius:8px;border:none;background:#43e97b;color:#111;font-weight:600;cursor:pointer">✓ Create Answer</button>
        <button id="join-show-qr" style="flex:1;padding:8px;border-radius:8px;border:none;background:#38f9d7;color:#111;font-weight:600;cursor:pointer">📱 QR Code</button>
        <button id="join-copy-answer" style="flex:1;padding:8px;border-radius:8px;border:none;background:#ff9500;color:#111;font-weight:600;cursor:pointer">📋 Copy Answer</button>
      </div>
      <textarea id="join-answer" style="width:100%;height:100px;margin-top:10px;padding:8px;border-radius:8px;border:1px solid rgba(56, 249, 215, 0.3);background:#1a1a1a;color:#fff;font-family:monospace;font-size:0.85em;resize:vertical" readonly placeholder="Your answer will appear here..."></textarea>
      <div id="join-qr-area" style="margin-top:12px;text-align:center"></div>
    </div>
  `

  const status = container.querySelector("#join-status")
  const offerTA = container.querySelector("#join-offer")
  const answerTA = container.querySelector("#join-answer")
  const createBtn = container.querySelector("#join-create-answer")
  const copyBtn = container.querySelector("#join-copy-answer")
  const qrBtn = container.querySelector("#join-show-qr")
  const qrArea = container.querySelector("#join-qr-area")

  createBtn.onclick = async () => {
    const remote = offerTA.value.trim()
    if (!remote) return alert("Paste the host's offer SDP first.")
    status.textContent = "⏳ Creating answer (gathering ICE)..."
    status.style.color = "#ffd"
    try {
      const answerSdp = await onlineClient.acceptManualOffer(remote)
      answerTA.value = answerSdp
      status.textContent = "✓ Answer created! Copy and send to host."
      status.style.color = "#43e97b"
    } catch (e) {
      status.style.color = "#ff4444"
      status.textContent = "❌ Failed: " + (e && e.message ? e.message : e)
    }
  }

  copyBtn.onclick = async () => {
    if (!answerTA.value) return alert("Create answer first.")
    try {
      await navigator.clipboard.writeText(answerTA.value)
      status.textContent = "✓ Answer copied to clipboard!"
      status.style.color = "#43e97b"
    } catch {
      answerTA.select()
      status.textContent = "⚠️ Copy failed. Select and copy manually."
      status.style.color = "#ff9500"
    }
  }

  qrBtn.onclick = () => {
    const text = answerTA.value || offerTA.value
    if (!text) return alert("Create answer first or paste an offer.")
    showQRCode(qrArea, text, { size: 280, label: "Scan Answer" })
  }
}

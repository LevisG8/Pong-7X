// Minimal WebSocket signaling server for Ultimate Pong
// Usage: npm install && node server.js
const WebSocket = require("ws")

const PORT = process.env.PORT || 3000
const wss = new WebSocket.Server({ port: PORT })
console.log(`Signaling server listening on ws://localhost:${PORT}`)

const rooms = new Map() // roomId -> Set of ws

function joinRoom(roomId, ws) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set())
  rooms.get(roomId).add(ws)
  ws.roomId = roomId
}

function leaveRoom(roomId, ws) {
  if (!rooms.has(roomId)) return
  rooms.get(roomId).delete(ws)
  if (rooms.get(roomId).size === 0) rooms.delete(roomId)
}

wss.on("connection", (ws) => {
  ws.isAlive = true
  ws.on("pong", () => (ws.isAlive = true))

  console.log("New client connected")

  ws.on("message", (msg) => {
    let data
    try {
      data = JSON.parse(msg)
    } catch (e) {
      console.warn("Invalid JSON", e)
      return
    }
    const { type, room } = data

    console.log(`Message received: type=${type}, room=${room}`)

    if (type === "join" && room) {
      joinRoom(room, ws)
      // inform the joiner how many clients are present
      const clients = rooms.get(room) ? rooms.get(room).size : 0
      ws.send(JSON.stringify({ type: "joined", room, clients }))
      console.log(`Client joined room ${room}, total clients: ${clients}`)

      // notify other clients that someone joined (useful for starter logic)
      rooms.get(room).forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "peer-joined", room }))
        }
      })
      return
    }

    // Broadcast all other messages to other clients in the same room
    if (room && rooms.has(room)) {
      for (const client of rooms.get(room)) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(msg)
        }
      }
    }
  })

  ws.on("close", () => {
    console.log("Client disconnected")
    if (ws.roomId) {
      leaveRoom(ws.roomId, ws)
      // notify remaining peers
      const room = ws.roomId
      if (rooms.has(room)) {
        for (const client of rooms.get(room)) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "peer-left", room }))
          }
        }
      }
    }
  })

  ws.on("error", (error) => {
    console.error("WebSocket error:", error)
  })
})

// simple heartbeat to clean up dead clients
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate()
    ws.isAlive = false
    ws.ping(() => {})
  })
}, 30000)

process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...")
  wss.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})

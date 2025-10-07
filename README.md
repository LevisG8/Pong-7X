# Ultimate Pong

A feature-rich Pong game with AI, online multiplayer, power-ups, themes, and more!

## Features

- **Smart AI Opponent** - Difficulty-based AI that adapts to your skill level
- **Online Multiplayer** - Play with friends via WebRTC peer-to-peer connection
- **Local Multiplayer** - Two players on the same device
- **Power-ups** - Enlarge, shrink, multi-ball, speed changes, and invisibility
- **Multiple Themes** - Switch between different visual themes with music
- **Achievements** - Unlock achievements as you play
- **Replay System** - Watch your best rallies
- **Customization** - Different paddle and ball skins
- **Multiple Input Methods** - Mouse, touch, keyboard, and gamepad support
- **Mobile Controls** - Stylish on-screen joysticks for touch devices
- **Custom Music** - Upload your own music files to play during the game

## Getting Started

### Playing Locally

1. Open `index.html` in a modern web browser
2. Click "Start" to begin playing against the AI
3. Use mouse, touch, or keyboard (W/S or Arrow keys) to control your paddle

### Controls

- **Mouse**: Move paddle by moving mouse
- **Touch**: Drag paddle on touch devices or use on-screen joysticks
- **Keyboard**: 
  - W/S or ↑/↓ - Move paddle
  - M - Toggle mute
  - Tab - Toggle local multiplayer
  - C - Cycle customization
  - P/Escape - Pause
  - O - Open settings
  - ? - Show tutorial
  - R - Show replay
- **Gamepad**: Left stick controls paddle (auto-detected)
- **Double-click canvas** - Change theme

### Mobile/Tablet Controls

On touch devices, stylish on-screen joysticks will automatically appear:
- **Single Player**: One joystick on the left for player 1
- **Local Multiplayer**: Two joysticks (left for P1, right for P2)
- Drag the glowing thumb up/down to control your paddle
- Visual feedback with animated arrows shows your direction

### Custom Music

1. Press `O` to open settings
2. Scroll to "Custom Music" section
3. Click "Choose File" and select an MP3, WAV, or OGG file
4. Music will start playing immediately
5. Your custom music replaces the theme music

### Online Multiplayer Setup

#### Option 1: Manual P2P (No Server Required)

1. Press `O` to open settings
2. Click "🎮 Host" button
3. Copy the offer text (or show QR code for mobile)
4. Send to your friend via any messaging app
5. Friend clicks "🔗 Join" and pastes your offer
6. Friend copies their answer and sends it back
7. Click "✓ Paste Answer" to complete connection
8. Start playing!

#### Option 2: Signaling Server (Automatic)

1. Install Node.js if not already installed
2. Navigate to the `server` directory:
   \`\`\`bash
   cd server
   npm install
   npm start
   \`\`\`
3. Server will start on `ws://localhost:3000`
4. In the game, press `O` for settings
5. Enter `ws://localhost:3000` in the signaling server field
6. Click "Connect Server"
7. Both players join the same room ID

## Project Structure

\`\`\`
ultimatePong/
├── index.html          # Main HTML file
├── style.css           # Styles
├── src/                # Game source code
│   ├── main.js         # Entry point
│   ├── GameManager.js  # Core game logic
│   ├── Paddle.js       # Paddle with AI
│   ├── Ball.js         # Ball physics
│   ├── TouchJoystick.js # Mobile on-screen controls
│   ├── OnlineMultiplayer.js  # WebRTC networking
│   ├── SettingsMenu.js # Settings UI
│   ├── AudioManager.js # Sound and music
│   └── ...             # Other game modules
├── server/             # Signaling server
│   ├── server.js       # WebSocket server
│   └── package.json    # Server dependencies
└── README.md           # This file
\`\`\`

## Troubleshooting

### AI Not Working
- Make sure the game is running (not paused)
- Check that difficulty is set (press O for settings)
- The AI should track the ball automatically
- AI difficulty increases with higher difficulty settings

### Mobile Controls Not Showing
- Joysticks only appear on touch-enabled devices
- Make sure you're accessing the game on a phone or tablet
- Try refreshing the page if they don't appear
- In local multiplayer mode, two joysticks will appear

### Custom Music Not Playing
- Ensure the file is a valid audio format (MP3, WAV, OGG)
- Check that sound is not muted (press M or check settings)
- Browser may block autoplay - click the page first
- File size should be reasonable (under 10MB recommended)

### Multiplayer Connection Issues
- **Manual mode**: Make sure to copy the ENTIRE offer/answer text
- **QR Code**: Use the QR code feature for easy mobile sharing
- **Server mode**: Ensure the signaling server is running (`npm start` in server folder)
- Check browser console for error messages
- Try using a different STUN server in settings
- Some corporate networks may block WebRTC - try on a different network
- Wait for "ICE gathering complete" status before sharing offer/answer

### Performance Issues
- Close other browser tabs
- Reduce browser zoom to 100%
- Try a different browser (Chrome/Edge recommended)
- On mobile, close background apps

## Browser Compatibility

- Chrome/Edge: Full support ✅
- Firefox: Full support ✅
- Safari: Full support (iOS 11+) ✅
- Opera: Full support ✅

## Tips & Tricks

- **Difficulty**: Start on Easy and work your way up
- **Power-ups**: Collect power-ups to gain advantages
- **Rallies**: Long rallies unlock achievements
- **Themes**: Each theme has unique music and visuals
- **Replays**: Press R to watch your best rallies
- **Mobile**: Use landscape mode for best experience on phones

## License

See LICENSE file for details.

## Credits

Built with vanilla HTML, CSS, and JavaScript. No frameworks required!

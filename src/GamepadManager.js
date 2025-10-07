export default class GamepadManager {
  constructor(game) {
    this.game = game;
    this.p1Axis = 1;
    this.p2Axis = 3;
    this.polling = false;
    window.addEventListener("gamepadconnected", () => this.start());
    window.addEventListener("gamepaddisconnected", () => this.stop());
  }

  start() {
    if (!this.polling) { this.polling = true; this.poll(); }
  }

  stop() { this.polling = false; }

  poll() {
    if (!this.polling) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (pads[0]) {
      const v = pads[0].axes[this.p1Axis] || 0;
      if (this.game.players[0]) {
        this.game.players[0].y += v * 8;
        this.game.players[0].y = Math.max(0, Math.min(this.game.canvas.height - this.game.players[0].height, this.game.players[0].y));
      }
    }
    if (this.game.multiplayer && pads[1]) {
      const v = pads[1].axes[this.p2Axis] || 0;
      if (this.game.players[1]) {
        this.game.players[1].y += v * 8;
        this.game.players[1].y = Math.max(0, Math.min(this.game.canvas.height - this.game.players[1].height, this.game.players[1].y));
      }
    }
    requestAnimationFrame(() => this.poll());
  }
}

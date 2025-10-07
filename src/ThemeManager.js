export default class ThemeManager {
  constructor(game) {
    this.game = game;
    this.themes = [
      {
        name: "Neon",
        background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        paddleColors: ["#43e97b", "#ff2d55"],
        ballColor: "#ffffff",
        netColor: "#ffffff88",
        trailColor: "#ffffff",
        particleColor: "#43e97b",
        music: ""
      },
      {
        name: "Retro",
        background: "linear-gradient(90deg, #f7971e 0%, #ffd200 100%)",
        paddleColors: ["#00eaff", "#ff5f5f"],
        ballColor: "#ffffff",
        netColor: "#22222288",
        trailColor: "#ffffffaa",
        particleColor: "#ffd200",
        music: ""
      }
    ];
    this.currentIndex = 0;
    this.applyTheme(0);
  }

  applyTheme(index) {
    this.currentIndex = index % this.themes.length;
    const theme = this.getCurrent();
    const canvas = document.getElementById('pong');
    if (canvas) canvas.style.background = theme.background;
  }

  nextTheme() {
    this.applyTheme((this.currentIndex + 1) % this.themes.length);
    if (this.game && this.game.audio) {
      const url = this.getCurrent().music;
      if (url && !this.game.audio.muted) this.game.audio.playMusic(url);
    }
  }

  getCurrent() { return this.themes[this.currentIndex]; }
}

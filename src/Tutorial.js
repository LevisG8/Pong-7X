export default class Tutorial {
  constructor(game) {
    this.game = game;
    this.steps = [
      { text: "Welcome! Move your paddle with mouse, keyboard, touch, or gamepad.", btn: "Next" },
      { text: "Collect power-ups and beat the AI. Tab toggles local multiplayer.", btn: "Next" },
      { text: "Press P to pause, R to replay last rally, O for settings.", btn: "Finish" }
    ];
    this.index = 0;
  }

  start() {
    this.index = 0;
    this.showStep();
  }

  showStep() {
    const s = this.steps[this.index];
    this.game.showOverlay("Tutorial", s.text, s.btn);
    this.game.overlayBtn.onclick = () => {
      this.index++;
      if (this.index >= this.steps.length) {
        this.game.hideOverlay();
        this.game._bindOverlayStart();
      } else {
        this.showStep();
      }
    };
  }
}

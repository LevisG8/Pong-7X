export default class Customization {
  constructor() {
    this.paddleSkins = [
      { name: "Classic", color: "#43e97b" },
      { name: "Neon", color: "#38f9d7" },
      { name: "Retro", color: "#ffd200" },
      { name: "Fire", color: "#ff5f5f" }
    ];
    this.ballSkins = [
      { name: "White", color: "#ffffff" },
      { name: "Aqua", color: "#38f9d7" },
      { name: "Gold", color: "#ffd200" }
    ];
    this.selectedPaddle = 0;
    this.selectedBall = 0;
  }

  nextPaddle() {
    this.selectedPaddle = (this.selectedPaddle + 1) % this.paddleSkins.length;
    return this.getPaddle();
  }

  nextBall() {
    this.selectedBall = (this.selectedBall + 1) % this.ballSkins.length;
    return this.getBall();
  }

  getPaddle() { return this.paddleSkins[this.selectedPaddle]; }
  getBall() { return this.ballSkins[this.selectedBall]; }
}

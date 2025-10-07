export default class DifficultyManager {
  constructor(game) {
    this.game = game;
    // AI level controls how aggressively AI tracks the ball; ballSpeed controls baseline speed
    this.difficulties = [
      { name: "Easy", aiLevel: 0.7, ballSpeed: 4.8, paddleSpeed: 5 },   // AI moves slower, ball slower
      { name: "Normal", aiLevel: 1.0, ballSpeed: 6, paddleSpeed: 6 },   // baseline
      { name: "Hard", aiLevel: 1.6, ballSpeed: 8, paddleSpeed: 7.5 },   // AI more aggressive, ball faster
      { name: "Adaptive", aiLevel: "adaptive", ballSpeed: "adaptive", paddleSpeed: 6.5 }
    ];
    this.selected = 1; // default Normal
  }

  getCurrent() { return this.difficulties[this.selected]; }
  next() { this.selected = (this.selected + 1) % this.difficulties.length; return this.getCurrent(); }
  set(index) { this.selected = Math.max(0, Math.min(index, this.difficulties.length - 1)); }

  // returns ai speed multiplier used to scale AI paddle max move
  getAILevel(scoreDiff = 0) {
    const diff = this.getCurrent();
    if (diff.aiLevel === "adaptive") {
      // make it adapt to score difference: if player leads, AI gets stronger
      const base = 1.0;
      return base + Math.min(1.2, Math.max(-0.4, (scoreDiff || 0) * 0.12));
    }
    return diff.aiLevel;
  }

  getBallSpeed(score = 0) {
    const diff = this.getCurrent();
    if (diff.ballSpeed === "adaptive") {
      return 6 + Math.min(4, Math.floor(score / 2));
    }
    return diff.ballSpeed;
  }

  getPaddleSpeed() {
    return this.getCurrent().paddleSpeed || 6;
  }
}

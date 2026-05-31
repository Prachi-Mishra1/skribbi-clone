import { Player } from "./Player";

export interface GameSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hintCount: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  maxPlayers: 8, rounds: 3, drawTime: 80, wordCount: 3, hintCount: 2
};

export class Game {
  settings: GameSettings;
  phase: string;
  currentRound: number;
  currentDrawerIndex: number;
  currentWord: string;
  wordOptions: string[];
  hintsRevealed: number;
  hintIntervals: any[];
  drawTimer: any;
  timeLeft: number;
  strokes: any[][];
  currentStroke: any[];
  usedWords: string[];

  constructor(settings: Partial<GameSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.phase = "lobby";
    this.currentRound = 0;
    this.currentDrawerIndex = -1;
    this.currentWord = "";
    this.wordOptions = [];
    this.hintsRevealed = 0;
    this.hintIntervals = [];
    this.drawTimer = null;
    this.timeLeft = this.settings.drawTime;
    this.strokes = [];
    this.currentStroke = [];
    this.usedWords = [];
  }

  getWords(count: number): string[] {
    const WORDS = [
      "cat","dog","elephant","giraffe","penguin","dolphin",
      "pizza","hamburger","sushi","tacos","waffle","croissant",
      "umbrella","telescope","backpack","compass","lantern",
      "swimming","dancing","sleeping","cooking","reading",
      "lighthouse","volcano","pyramid","igloo","castle",
      "dragon","wizard","unicorn","mermaid","phoenix","zombie"
    ];
    const available = WORDS.filter(w => !this.usedWords.includes(w));
    return available.sort(() => Math.random() - 0.5).slice(0, count);
  }

  getHint(): string {
    const word = this.currentWord;
    const chars = word.split("");
    const indices = chars.map((c,i) => c !== " " ? i : -1).filter(i => i !== -1);
    const toReveal = indices.sort(() => Math.random() - 0.5).slice(0, this.hintsRevealed);
    return chars.map((c,i) => c === " " ? " " : toReveal.includes(i) ? c : "_").join(" ");
  }

  startGame(players: Player[]) {
    this.phase = "word_selection";
    this.currentRound = 1;
    this.currentDrawerIndex = 0;
    players.forEach(p => p.resetRound());
    players[0].isDrawing = true;
    this.wordOptions = this.getWords(this.settings.wordCount);
  }

  chooseWord(word: string) {
    this.currentWord = word;
    this.usedWords.push(word);
    this.phase = "drawing";
    this.strokes = [];
    this.currentStroke = [];
    this.hintsRevealed = 0;
    this.timeLeft = this.settings.drawTime;
  }

  calculateGuessPoints(timeLeft: number, maxTime: number): number {
    return 100 + Math.floor((timeLeft / maxTime) * 900);
  }

  undoLastStroke(): boolean {
    if (this.strokes.length === 0) return false;
    this.strokes.pop();
    return true;
  }

  clearCanvas() {
    this.strokes = [];
    this.currentStroke = [];
  }

  nextRound(players: Player[]): {
    isGameOver: boolean;
    nextDrawerId?: string;
    wordOptions?: string[]
  } {
    this.clearHintTimers();
    players.forEach(p => p.resetRound());
    this.currentDrawerIndex++;
    if (this.currentDrawerIndex >= players.length) {
      this.currentRound++;
      this.currentDrawerIndex = 0;
      if (this.currentRound > this.settings.rounds) {
        this.phase = "game_over";
        return { isGameOver: true };
      }
    }
    const nextDrawer = players[this.currentDrawerIndex];
    if (!nextDrawer) {
      this.phase = "game_over";
      return { isGameOver: true };
    }
    nextDrawer.isDrawing = true;
    this.phase = "word_selection";
    this.wordOptions = this.getWords(this.settings.wordCount);
    this.currentWord = "";
    return {
      isGameOver: false,
      nextDrawerId: nextDrawer.id,
      wordOptions: this.wordOptions
    };
  }

  clearHintTimers() {
    this.hintIntervals.forEach(clearTimeout);
    this.hintIntervals = [];
    if (this.drawTimer) {
      clearInterval(this.drawTimer);
      this.drawTimer = null;
    }
  }

  checkGuess(guess: string): boolean {
    return guess.trim().toLowerCase() === this.currentWord.toLowerCase();
  }
}
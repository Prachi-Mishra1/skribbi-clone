export class Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isDrawing: boolean;
  hasGuessed: boolean;
  socketId: string;
  avatar: string;

  constructor(id: string, name: string, socketId: string, isHost: boolean = false) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.score = 0;
    this.isHost = isHost;
    this.isDrawing = false;
    this.hasGuessed = false;
    const colors = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD"];
    this.avatar = colors[Math.floor(Math.random() * colors.length)];
  }

  addScore(points: number) { this.score += points; }
  resetRound() { this.isDrawing = false; this.hasGuessed = false; }

  toJSON() {
    return {
      id: this.id, name: this.name, score: this.score,
      isHost: this.isHost, isDrawing: this.isDrawing,
      hasGuessed: this.hasGuessed, socketId: this.socketId, avatar: this.avatar
    };
  }
}
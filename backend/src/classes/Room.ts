import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { Player } from "./Player";
import { Game, GameSettings } from "./Game";

export class Room {
  id: string;
  code: string;
  isPrivate: boolean;
  players: Map<string, Player>;
  game: Game;
  io: Server;
  chatMessages: any[];

  constructor(io: Server, settings: Partial<GameSettings> = {}, isPrivate: boolean = false) {
    this.id = uuidv4();
    this.code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.io = io;
    this.isPrivate = isPrivate;
    this.players = new Map();
    this.game = new Game(settings);
    this.chatMessages = [];
  }

  addPlayer(socket: Socket, name: string): Player {
    const isHost = this.players.size === 0;
    const player = new Player(socket.id, name, socket.id, isHost);
    this.players.set(socket.id, player);
    socket.join(this.id);
    return player;
  }

  removePlayer(socketId: string): { wasHost: boolean; newHost?: Player } {
    const player = this.players.get(socketId);
    if (!player) return { wasHost: false };
    const wasHost = player.isHost;
    this.players.delete(socketId);
    let newHost: Player | undefined;
    if (wasHost && this.players.size > 0) {
      newHost = Array.from(this.players.values())[0];
      newHost.isHost = true;
    }
    return { wasHost, newHost };
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    return this.players.get(socketId);
  }

  getCurrentDrawer(): Player | undefined {
    return Array.from(this.players.values()).find(p => p.isDrawing);
  }

  getPlayersArray(): Player[] {
    return Array.from(this.players.values());
  }

  broadcast(event: string, data: any) {
    this.io.to(this.id).emit(event, data);
  }

  broadcastExcept(socketId: string, event: string, data: any) {
    this.io.to(this.id).except(socketId).emit(event, data);
  }

  addChatMessage(playerId: string, playerName: string, text: string, type: string = "chat") {
    const msg = { playerId, playerName, text, type, timestamp: Date.now() };
    this.chatMessages.push(msg);
    if (this.chatMessages.length > 100) this.chatMessages.shift();
    this.broadcast("chat_message", msg);
  }

  startHintTimers() {
    const { hintCount, drawTime } = this.game.settings;
    if (hintCount === 0) return;
    for (let i = 1; i <= hintCount; i++) {
      const delay = (drawTime / (hintCount + 1)) * i * 1000;
      const timer = setTimeout(() => {
        this.game.hintsRevealed = i;
        this.broadcast("hint_update", { hint: this.game.getHint() });
      }, delay);
      this.game.hintIntervals.push(timer);
    }
  }

  startTimer(onTimeUp: () => void) {
    this.game.timeLeft = this.game.settings.drawTime;
    this.game.drawTimer = setInterval(() => {
      this.game.timeLeft--;
      this.broadcast("timer_update", { timeLeft: this.game.timeLeft });
      if (this.game.timeLeft <= 0) {
        this.game.clearHintTimers();
        onTimeUp();
      }
    }, 1000);
  }

  endRound() {
    this.game.clearHintTimers();
    this.game.phase = "round_end";
  }

  toPublicJSON() {
    return {
      id: this.id, code: this.code, isPrivate: this.isPrivate,
      playerCount: this.players.size, maxPlayers: this.game.settings.maxPlayers,
      phase: this.game.phase, settings: this.game.settings
    };
  }
}

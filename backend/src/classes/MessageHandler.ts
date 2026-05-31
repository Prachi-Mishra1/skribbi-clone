import { Server, Socket } from "socket.io";
import { Room } from "./Room";
import { GameSettings } from "./Game";

export class MessageHandler {
  private io: Server;
  private rooms: Map<string, Room>;
  private socketToRoom: Map<string, string>;

  constructor(io: Server) {
    this.io = io;
    this.rooms = new Map();
    this.socketToRoom = new Map();
  }

  handle(socket: Socket) {
    console.log(`[+] Connected: ${socket.id}`);

    socket.on("create_room", (data: any) => {
      const room = new Room(this.io, data.settings || {}, data.isPrivate || false);
      this.rooms.set(room.id, room);
      const player = room.addPlayer(socket, data.playerName || "Player");
      this.socketToRoom.set(socket.id, room.id);
      socket.emit("room_created", {
        roomId: room.id, roomCode: room.code, player: player.toJSON(),
        players: room.getPlayersArray().map(p => p.toJSON()), settings: room.game.settings
      });
    });

    socket.on("join_room", (data: any) => {
      const room = Array.from(this.rooms.values()).find(r => r.code === data.roomCode?.toUpperCase());
      if (!room) { socket.emit("error", { message: "Room not found!" }); return; }
      if (room.players.size >= room.game.settings.maxPlayers) { socket.emit("error", { message: "Room is full!" }); return; }
      if (room.game.phase !== "lobby") { socket.emit("error", { message: "Game already started!" }); return; }
      const player = room.addPlayer(socket, data.playerName || "Player");
      this.socketToRoom.set(socket.id, room.id);
      socket.emit("room_joined", {
        roomId: room.id, roomCode: room.code, player: player.toJSON(),
        players: room.getPlayersArray().map(p => p.toJSON()),
        settings: room.game.settings, chatMessages: room.chatMessages
      });
      room.broadcastExcept(socket.id, "player_joined", {
        player: player.toJSON(), players: room.getPlayersArray().map(p => p.toJSON())
      });
    });

    socket.on("start_game", () => {
      const room = this.getRoom(socket); if (!room) return;
      const player = room.getPlayerBySocketId(socket.id);
      if (!player?.isHost) { socket.emit("error", { message: "Only host can start!" }); return; }
      if (room.players.size < 2) { socket.emit("error", { message: "Need at least 2 players!" }); return; }
      const players = room.getPlayersArray();
      room.game.startGame(players);
      const drawer = room.getCurrentDrawer()!;
      room.broadcast("game_started", { players: players.map(p => p.toJSON()), round: 1, totalRounds: room.game.settings.rounds });
      this.io.sockets.sockets.get(drawer.socketId)?.emit("word_options", { words: room.game.wordOptions });
      room.broadcastExcept(drawer.socketId, "round_start", { drawerId: drawer.id, drawerName: drawer.name, round: 1, totalRounds: room.game.settings.rounds });
    });

    socket.on("word_chosen", (data: any) => {
      const room = this.getRoom(socket); if (!room) return;
      const player = room.getPlayerBySocketId(socket.id);
      if (!player?.isDrawing) return;
      room.game.chooseWord(data.word);
      const blanks = data.word.split("").map((c: string) => c === " " ? " " : "_").join(" ");
      socket.emit("drawing_start", { word: data.word, hint: blanks, drawTime: room.game.settings.drawTime });
      room.broadcastExcept(socket.id, "drawing_start", { word: null, hint: blanks, drawerId: player.id, drawerName: player.name, drawTime: room.game.settings.drawTime });
      room.startHintTimers();
      room.startTimer(() => this.timeUp(room));
    });

    socket.on("draw_start", (data: any) => {
      const room = this.getRoom(socket); if (!room) return;
      if (!room.getPlayerBySocketId(socket.id)?.isDrawing) return;
      room.game.strokes.push([{ type: "start", ...data }]);
      room.broadcastExcept(socket.id, "draw_data", { type: "start", ...data });
    });

    socket.on("draw_move", (data: any) => {
      const room = this.getRoom(socket); if (!room) return;
      if (!room.getPlayerBySocketId(socket.id)?.isDrawing) return;
      const last = room.game.strokes[room.game.strokes.length - 1];
      if (last) last.push({ type: "move", ...data });
      room.broadcastExcept(socket.id, "draw_data", { type: "move", ...data });
    });

    socket.on("draw_end", () => {
      const room = this.getRoom(socket); if (!room) return;
      room.broadcastExcept(socket.id, "draw_data", { type: "end" });
    });

    socket.on("canvas_clear", () => {
      const room = this.getRoom(socket); if (!room) return;
      if (!room.getPlayerBySocketId(socket.id)?.isDrawing) return;
      room.game.clearCanvas();
      room.broadcast("canvas_cleared", {});
    });

    socket.on("draw_undo", () => {
      const room = this.getRoom(socket); if (!room) return;
      if (!room.getPlayerBySocketId(socket.id)?.isDrawing) return;
      room.game.undoLastStroke();
      room.broadcast("draw_undo", { strokes: room.game.strokes });
    });

    socket.on("guess", (data: any) => {
      const room = this.getRoom(socket); if (!room) return;
      const player = room.getPlayerBySocketId(socket.id);
      if (!player || player.isDrawing || player.hasGuessed) return;
      if (room.game.phase !== "drawing") return;
      const correct = room.game.checkGuess(data.text);
      if (correct) {
        player.hasGuessed = true;
        const points = room.game.calculateGuessPoints(room.game.timeLeft, room.game.settings.drawTime);
        player.addScore(points);
        room.broadcast("guess_result", { correct: true, playerId: player.id, playerName: player.name, points, players: room.getPlayersArray().map(p => p.toJSON()) });
        room.addChatMessage("system", "System", `🎉 ${player.name} guessed the word!`, "correct_guess");
        const allGuessed = room.getPlayersArray().filter(p => !p.isDrawing).every(p => p.hasGuessed);
        if (allGuessed) this.timeUp(room);
      } else {
        room.addChatMessage(player.id, player.name, data.text?.slice(0, 200), "guess");
        socket.emit("guess_result", { correct: false });
      }
    });

    socket.on("chat", (data: any) => {
      const room = this.getRoom(socket); if (!room) return;
      const player = room.getPlayerBySocketId(socket.id); if (!player) return;
      if (player.isDrawing && room.game.phase === "drawing") return;
      room.addChatMessage(player.id, player.name, data.text?.slice(0, 200), "chat");
    });

    socket.on("disconnect", () => {
      const room = this.getRoom(socket); if (!room) return;
      const player = room.getPlayerBySocketId(socket.id);
      const wasDrawing = player?.isDrawing || false;
      room.removePlayer(socket.id);
      this.socketToRoom.delete(socket.id);
      if (room.players.size === 0) { 
        room.game.clearHintTimers(); 
        this.rooms.delete(room.id); 
        return; 
      }
      room.broadcast("player_left", { playerId: socket.id, players: room.getPlayersArray().map(p => p.toJSON()) });
      if (wasDrawing && room.game.phase === "drawing") {
        room.endRound();
        room.broadcast("round_end", { word: room.game.currentWord, players: room.getPlayersArray().map(p => p.toJSON()), round: room.game.currentRound, totalRounds: room.game.settings.rounds });
        setTimeout(() => this.nextRound(room), 4000);
      }
    });
  }

  private timeUp(room: Room) {
    room.endRound();
    room.broadcast("round_end", { word: room.game.currentWord, players: room.getPlayersArray().map(p => p.toJSON()), round: room.game.currentRound, totalRounds: room.game.settings.rounds });
    setTimeout(() => this.nextRound(room), 5000);
  }

  private nextRound(room: Room) {
    const players = room.getPlayersArray();
    const result = room.game.nextRound(players);
    if (result.isGameOver) {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      room.broadcast("game_over", { winner: sorted[0]?.toJSON(), leaderboard: sorted.map(p => p.toJSON()) });
      return;
    }
    const drawer = room.getCurrentDrawer()!;
    room.broadcast("next_round", { round: room.game.currentRound, totalRounds: room.game.settings.rounds, drawerId: drawer.id, drawerName: drawer.name, players: players.map(p => p.toJSON()) });
    this.io.sockets.sockets.get(drawer.socketId)?.emit("word_options", { words: result.wordOptions });
    room.broadcastExcept(drawer.socketId, "round_start", { drawerId: drawer.id, drawerName: drawer.name, round: room.game.currentRound, totalRounds: room.game.settings.rounds });
  }

  private getRoom(socket: Socket): Room | undefined {
    const roomId = this.socketToRoom.get(socket.id);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  getRooms() { return this.rooms; }
}
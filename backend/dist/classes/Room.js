"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const uuid_1 = require("uuid");
const Player_1 = require("./Player");
const Game_1 = require("./Game");
class Room {
    constructor(io, settings = {}, isPrivate = false) {
        this.id = (0, uuid_1.v4)();
        this.code = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.io = io;
        this.isPrivate = isPrivate;
        this.players = new Map();
        this.game = new Game_1.Game(settings);
        this.chatMessages = [];
    }
    addPlayer(socket, name) {
        const isHost = this.players.size === 0;
        const player = new Player_1.Player(socket.id, name, socket.id, isHost);
        this.players.set(socket.id, player);
        socket.join(this.id);
        return player;
    }
    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (!player)
            return { wasHost: false };
        const wasHost = player.isHost;
        this.players.delete(socketId);
        let newHost;
        if (wasHost && this.players.size > 0) {
            newHost = Array.from(this.players.values())[0];
            newHost.isHost = true;
        }
        return { wasHost, newHost };
    }
    getPlayerBySocketId(socketId) {
        return this.players.get(socketId);
    }
    getCurrentDrawer() {
        return Array.from(this.players.values()).find(p => p.isDrawing);
    }
    getPlayersArray() {
        return Array.from(this.players.values());
    }
    broadcast(event, data) {
        this.io.to(this.id).emit(event, data);
    }
    broadcastExcept(socketId, event, data) {
        this.io.to(this.id).except(socketId).emit(event, data);
    }
    addChatMessage(playerId, playerName, text, type = "chat") {
        const msg = { playerId, playerName, text, type, timestamp: Date.now() };
        this.chatMessages.push(msg);
        if (this.chatMessages.length > 100)
            this.chatMessages.shift();
        this.broadcast("chat_message", msg);
    }
    startHintTimers() {
        const { hintCount, drawTime } = this.game.settings;
        if (hintCount === 0)
            return;
        for (let i = 1; i <= hintCount; i++) {
            const delay = (drawTime / (hintCount + 1)) * i * 1000;
            const timer = setTimeout(() => {
                this.game.hintsRevealed = i;
                this.broadcast("hint_update", { hint: this.game.getHint() });
            }, delay);
            this.game.hintIntervals.push(timer);
        }
    }
    startTimer(onTimeUp) {
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
exports.Room = Room;

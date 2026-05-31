import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')))
app.get("/health", (_, res) => res.json({ status: "ok" }));
app.get('*', (_, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'))
})

interface Player {
  id: string
  name: string
  score: number
  isHost: boolean
  isDrawing: boolean
  hasGuessed: boolean
  socketId: string
  avatar: string
}

interface Room {
  id: string
  code: string
  players: Player[]
  settings: { maxPlayers: number; rounds: number; drawTime: number; wordCount: number; hintCount: number }
  phase: 'lobby' | 'word_selection' | 'drawing' | 'round_end' | 'game_over'
  round: number
  drawerIndex: number
  currentWord: string
  wordOptions: string[]
  strokes: any[]
  chatMessages: any[]
  timer: NodeJS.Timeout | null
  hintTimer: NodeJS.Timeout | null
  hint: string
  lastRoundWord: string
  winner: Player | null
  leaderboard: Player[]
}

const WORDS = [
  'apple','banana','car','dog','elephant','flower','guitar','house','island','jungle',
  'king','lion','moon','notebook','ocean','piano','queen','river','sun','tree',
  'umbrella','violin','waterfall','xylophone','yacht','zebra','airplane','bridge','castle',
  'dragon','eagle','forest','ghost','hammer','igloo','jellyfish','knife','ladder','mountain',
  'ninja','orange','penguin','rainbow','snake','tornado','unicorn','volcano','wizard','fox'
]

function randomWords(n: number) {
  return [...WORDS].sort(() => Math.random() - 0.5).slice(0, n)
}

function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function makeHint(word: string, revealed: number) {
  return word.split('').map((ch, i) => i < revealed ? ch : '_').join(' ')
}

const rooms = new Map<string, Room>()
const socketToRoom = new Map<string, string>()

function getRoom(roomId: string) { return rooms.get(roomId) }

function broadcastGameState(room: Room) {
  room.players.forEach(player => {
    const socket = io.sockets.sockets.get(player.socketId)
    if (!socket) return
    socket.emit('game_state', {
      phase: room.phase,
      round: room.round,
      totalRounds: room.settings.rounds,
      drawerId: room.players[room.drawerIndex]?.id ?? '',
      drawerName: room.players[room.drawerIndex]?.name ?? '',
      currentWord: player.id === room.players[room.drawerIndex]?.id ? room.currentWord : null,
      hint: room.hint,
      timeLeft: 0,
      players: room.players,
      chatMessages: room.chatMessages,
      wordOptions: player.id === room.players[room.drawerIndex]?.id ? room.wordOptions : [],
      lastRoundWord: room.lastRoundWord,
      winner: room.winner,
      leaderboard: room.leaderboard,
      roomId: room.id,
      roomCode: room.code,
      screen: 'game'
    })
  })
}

function clearTimers(room: Room) {
  if (room.timer) { clearTimeout(room.timer); room.timer = null }
  if (room.hintTimer) { clearInterval(room.hintTimer); room.hintTimer = null }
}

function startWordSelection(room: Room) {
  clearTimers(room)
  room.phase = 'word_selection'
  room.currentWord = ''
  room.hint = ''
  room.strokes = []
  room.wordOptions = randomWords(room.settings.wordCount)
  io.to(room.id).emit('canvas_cleared')

  // Send word options to drawer only
  const drawer = room.players[room.drawerIndex]
  const drawerSocket = io.sockets.sockets.get(drawer.socketId)
  if (drawerSocket) {
    drawerSocket.emit('word_options', { words: room.wordOptions })
  }

  // Broadcast round_start to all
  io.to(room.id).emit('round_start', {
    drawerId: drawer.id,
    drawerName: drawer.name,
    round: room.round,
    totalRounds: room.settings.rounds
  })

  broadcastGameState(room)

  room.timer = setTimeout(() => {
    if (room.phase === 'word_selection') {
      startDrawing(room, room.wordOptions[0])
    }
  }, 15000)
}

function startDrawing(room: Room, word: string) {
  clearTimers(room)
  room.phase = 'drawing'
  room.currentWord = word
  room.hint = makeHint(word, 0)
  room.players.forEach(p => { p.hasGuessed = false; p.isDrawing = p.id === room.players[room.drawerIndex].id })

  const drawer = room.players[room.drawerIndex]

  const sysMsg = {
    id: Date.now().toString(),
    playerId: 'system',
    playerName: 'System',
    text: `${drawer.name} is now drawing!`,
    type: 'system',
    timestamp: Date.now()
  }
  room.chatMessages.push(sysMsg)

  // Emit drawing_start to all
  io.to(room.id).emit('drawing_start', {
    drawerId: drawer.id,
    drawerName: drawer.name,
    word: word,
    hint: room.hint,
    drawTime: room.settings.drawTime
  })

  broadcastGameState(room)

  let timeLeft = room.settings.drawTime
  const tick = () => {
    io.to(room.id).emit('timer_update', { timeLeft })
    if (timeLeft <= 0) { endRound(room); return }
    timeLeft--
    room.timer = setTimeout(tick, 1000)
  }
  tick()

  if (room.settings.hintCount > 0) {
    const interval = Math.floor(room.settings.drawTime / (room.settings.hintCount + 1)) * 1000
    let revealed = 0
    room.hintTimer = setInterval(() => {
      if (room.phase !== 'drawing') return
      revealed = Math.min(revealed + 1, word.length - 1)
      room.hint = makeHint(word, revealed)
      io.to(room.id).emit('hint_update', { hint: room.hint })
    }, interval)
  }
}

function endRound(room: Room) {
  clearTimers(room)
  room.phase = 'round_end'
  room.lastRoundWord = room.currentWord
  room.players.forEach(p => { p.isDrawing = false })

  const sysMsg = {
    id: Date.now().toString(),
    playerId: 'system',
    playerName: 'System',
    text: `Round over! The word was: ${room.currentWord}`,
    type: 'system',
    timestamp: Date.now()
  }
  room.chatMessages.push(sysMsg)

  io.to(room.id).emit('round_end', {
    word: room.currentWord,
    players: room.players
  })

  broadcastGameState(room)
  room.timer = setTimeout(() => nextTurn(room), 4000)
}

function nextTurn(room: Room) {
  clearTimers(room)
  room.drawerIndex = (room.drawerIndex + 1) % room.players.length
  if (room.drawerIndex === 0) room.round++
  if (room.round > room.settings.rounds) { endGame(room); return }
  startWordSelection(room)
}

function endGame(room: Room) {
  clearTimers(room)
  room.phase = 'game_over'
  const sorted = [...room.players].sort((a, b) => b.score - a.score)
  room.winner = sorted[0]
  room.leaderboard = sorted
  io.to(room.id).emit('game_over', { winner: room.winner, leaderboard: room.leaderboard })
  broadcastGameState(room)
}

io.on("connection", socket => {

  socket.on('create_room', ({ playerName, settings }) => {
    const roomId = Math.random().toString(36).substring(2, 10)
    const roomCode = makeCode()
    const player: Player = {
      id: socket.id, name: playerName, score: 0, isHost: true,
      isDrawing: false, hasGuessed: false, socketId: socket.id, avatar: '🎨'
    }
    const room: Room = {
      id: roomId, code: roomCode, players: [player],
      settings: {
        maxPlayers: settings?.maxPlayers ?? 8,
        rounds: settings?.rounds ?? 3,
        drawTime: settings?.drawTime ?? 80,
        wordCount: settings?.wordCount ?? 3,
        hintCount: settings?.hintCount ?? 2
      },
      phase: 'lobby', round: 1, drawerIndex: 0, currentWord: '',
      wordOptions: [], strokes: [], chatMessages: [], timer: null,
      hintTimer: null, hint: '', lastRoundWord: '', winner: null, leaderboard: []
    }
    rooms.set(roomId, room)
    socketToRoom.set(socket.id, roomId)
    socket.join(roomId)
    socket.emit('room_created', { roomId, roomCode, player })
    socket.emit('game_state', {
      phase: 'lobby', round: 1, totalRounds: room.settings.rounds,
      drawerId: '', drawerName: '', currentWord: null, hint: '', timeLeft: 0,
      players: room.players, chatMessages: [], wordOptions: [],
      lastRoundWord: '', winner: null, leaderboard: [],
      roomId, roomCode, screen: 'lobby', player
    })
  })

  socket.on('join_room', ({ roomCode, playerName }) => {
    const room = [...rooms.values()].find(r => r.code === roomCode)
    if (!room) { socket.emit('error', { message: 'Room not found' }); return }
    if (room.players.length >= room.settings.maxPlayers) { socket.emit('error', { message: 'Room is full' }); return }

    const player: Player = {
      id: socket.id, name: playerName, score: 0, isHost: false,
      isDrawing: false, hasGuessed: false, socketId: socket.id, avatar: '🎮'
    }
    room.players.push(player)
    socketToRoom.set(socket.id, room.id)
    socket.join(room.id)
    socket.emit('room_joined', { roomId: room.id, roomCode: room.code, player })
    socket.emit('game_state', {
      phase: 'lobby', round: 1, totalRounds: room.settings.rounds,
      drawerId: '', drawerName: '', currentWord: null, hint: '', timeLeft: 0,
      players: room.players, chatMessages: room.chatMessages, wordOptions: [],
      lastRoundWord: '', winner: null, leaderboard: [],
      roomId: room.id, roomCode: room.code, screen: 'lobby', player
    })
    io.to(room.id).emit('player_joined', { player, players: room.players })
  })

  socket.on('start_game', () => {
    const roomId = socketToRoom.get(socket.id)
    if (!roomId) return
    const room = getRoom(roomId)
    if (!room) return
    const player = room.players.find(p => p.socketId === socket.id)
    if (!player?.isHost) return
    if (room.players.length < 2) { socket.emit('error', { message: 'Need at least 2 players' }); return }
    room.round = 1
    room.drawerIndex = 0
    io.to(room.id).emit('game_started', {
      players: room.players,
      round: room.round,
      totalRounds: room.settings.rounds
    })
    startWordSelection(room)
  })

  socket.on('word_chosen', ({ word }) => {
    const roomId = socketToRoom.get(socket.id)
    if (!roomId) return
    const room = getRoom(roomId)
    if (!room || room.phase !== 'word_selection') return
    const drawer = room.players[room.drawerIndex]
    if (drawer.socketId !== socket.id) return
    startDrawing(room, word)
  })

  socket.on('draw_start', (data) => {
    const roomId = socketToRoom.get(socket.id)
    if (!roomId) return
    const room = getRoom(roomId)
    if (!room || room.phase !== 'drawing') return
    room.strokes.push(data)
    socket.to(roomId).emit('draw_data', data)
  })

  socket.on('draw_move', (data) => {
    const roomId = socketToRoom.get(socket.id)
    if (!roomId) return
    const room = getRoom(roomId)
    if (!room || room.phase !== 'drawing') return
    room.strokes.push(data)
    socket.to(roomId).emit('draw_data', data)
  })

  socket.on('draw_end', () => {
    const roomId = socketToRoom.get(socket.id)
    if (!roomId) return
    socket.to(roomId).emit('draw_data', { type: 'end' })
  })

  socket.on('canvas_clear', () => {
    const roomId = socketToRoom.get(socket.id)
    if (!roomId) return
    const room = getRoom(roomId)
    if (!room) return
    room.strokes = []
    io.to(roomId).emit('canvas_cleared')
  })

  socket.on('draw_undo', () => {
    const roomId = socketToRoom.get(socket.id)
    if (!roomId) return
    const room = getRoom(roomId)
    if (!room) return
    let i = room.strokes.length - 1
    while (i >= 0 && room.strokes[i].type !== 'start') i--
    if (i >= 0) room.strokes.splice(i)
    io.to(roomId).emit('draw_undo', { strokes: room.strokes })
  })

  socket.on('guess', ({ text }) => {
    const roomId = socketToRoom.get(socket.id)
    if (!roomId) return
    const room = getRoom(roomId)
    if (!room || room.phase !== 'drawing') return
    const player = room.players.find(p => p.socketId === socket.id)
    if (!player || player.hasGuessed) return
    const drawer = room.players[room.drawerIndex]
    if (player.id === drawer.id) return

    const isCorrect = text.trim().toLowerCase() === room.currentWord.toLowerCase()

    if (isCorrect) {
      player.hasGuessed = true
      const points = Math.max(10, Math.floor((room.settings.drawTime / 2) * 10))
      player.score += points
      drawer.score += 5

      const msg = {
        id: Date.now().toString(),
        playerId: 'system', playerName: 'System',
        text: `🎉 ${player.name} guessed the word! +${points} points`,
        type: 'correct_guess', timestamp: Date.now()
      }
      room.chatMessages.push(msg)
      io.to(roomId).emit('guess_result', { correct: true, playerId: player.id, playerName: player.name, points, players: room.players })
      io.to(roomId).emit('chat_message', msg)
      broadcastGameState(room)

      const nonDrawers = room.players.filter(p => p.id !== drawer.id)
      if (nonDrawers.every(p => p.hasGuessed)) endRound(room)
    } else {
      const msg = {
        id: Date.now().toString(),
        playerId: player.id, playerName: player.name,
        text, type: 'guess', timestamp: Date.now()
      }
      room.chatMessages.push(msg)
      io.to(roomId).emit('chat_message', msg)
    }
  })

  socket.on('chat', ({ text }) => {
    const roomId = socketToRoom.get(socket.id)
    if (!roomId) return
    const room = getRoom(roomId)
    if (!room) return
    const player = room.players.find(p => p.socketId === socket.id)
    if (!player) return
    const msg = {
      id: Date.now().toString(),
      playerId: player.id, playerName: player.name,
      text, type: 'chat', timestamp: Date.now()
    }
    room.chatMessages.push(msg)
    io.to(roomId).emit('chat_message', msg)
  })

  socket.on('disconnect', () => {
    const roomId = socketToRoom.get(socket.id)
    if (!roomId) return
    const room = getRoom(roomId)
    if (!room) return
    room.players = room.players.filter(p => p.socketId !== socket.id)
    socketToRoom.delete(socket.id)
    if (room.players.length === 0) { clearTimers(room); rooms.delete(roomId); return }
    if (!room.players.find(p => p.isHost)) room.players[0].isHost = true
    io.to(roomId).emit('player_left', { players: room.players })
    broadcastGameState(room)
  })
})

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
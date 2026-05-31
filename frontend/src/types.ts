export interface Player {
  id: string
  name: string
  score: number
  isHost: boolean
  isDrawing: boolean
  hasGuessed: boolean
  socketId: string
  avatar: string
}

export interface ChatMessage {
  playerId: string
  playerName: string
  text: string
  type: 'chat' | 'guess' | 'correct_guess' | 'system'
  timestamp: number
}

export interface GameSettings {
  maxPlayers: number
  rounds: number
  drawTime: number
  wordCount: number
  hintCount: number
  wordMode?: string
}

export interface GameState {
  screen: 'home' | 'lobby' | 'game'
  roomId: string
  roomCode: string
  player: Player | null
  players: Player[]
  settings: GameSettings
  phase: 'lobby' | 'word_selection' | 'drawing' | 'round_end' | 'game_over'
  round: number
  totalRounds: number
  drawerId: string
  drawerName: string
  currentWord: string | null
  hint: string
  timeLeft: number
  chatMessages: ChatMessage[]
  wordOptions: string[]
  lastRoundWord: string
  winner: Player | null
  leaderboard: Player[]
}
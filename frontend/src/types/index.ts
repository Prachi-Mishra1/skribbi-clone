export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isDrawing: boolean;
  hasGuessed: boolean;
  socketId: string;
  avatar: string;
}

export interface GameSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hintCount: number;
  wordMode: 'normal' | 'hidden' | 'combination';
}

export type GamePhase = 'lobby' | 'word_selection' | 'drawing' | 'round_end' | 'game_over';

export interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  type: 'chat' | 'guess' | 'correct_guess' | 'system';
  timestamp: number;
}

export interface DrawData {
  type: 'start' | 'move' | 'end';
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  tool?: 'pen' | 'eraser';
}

export type AppScreen = 'home' | 'lobby' | 'game';

export interface GameState {
  screen: AppScreen;
  roomId: string;
  roomCode: string;
  player: Player | null;
  players: Player[];
  settings: GameSettings;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  drawerId: string;
  drawerName: string;
  currentWord: string | null;
  hint: string;
  timeLeft: number;
  chatMessages: ChatMessage[];
  wordOptions: string[];
  lastRoundWord: string;
  winner: Player | null;
  leaderboard: Player[];
}
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [myId, setMyId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [drawData, setDrawData] = useState<any>(null);
  const [shouldClearCanvas, setShouldClearCanvas] = useState(false);
  const [undoStrokes, setUndoStrokes] = useState<any[][]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentHint, setCurrentHint] = useState('');
  const [isDrawer, setIsDrawer] = useState(false);
  const [currentWord, setCurrentWord] = useState('');

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setMyId(socket.id || '');
    });
    socket.on('disconnect', () => setConnected(false));

    // Room events
    socket.on('room_created', ({ roomId, roomCode, player, players, settings }: any) => {
      setRoomId(roomId);
      setRoomCode(roomCode);
      setPlayers(players);
      setIsHost(true);
      setSettings(settings);
    });

    socket.on('room_joined', ({ roomId, roomCode, players, settings, chatMessages }: any) => {
      setRoomId(roomId);
      setRoomCode(roomCode);
      setPlayers(players);
      setSettings(settings);
      if (chatMessages) setMessages(chatMessages);
    });

    socket.on('player_joined', ({ players }: any) => setPlayers(players));
    socket.on('player_left', ({ players }: any) => setPlayers(players));

    // Game start
    socket.on('game_started', ({ players, round, totalRounds }: any) => {
      setPlayers(players);
      setGameState({ phase: 'waiting', round, totalRounds });
    });

    // Drawer gets word options
    socket.on('word_options', ({ words }: any) => {
      setWordOptions(words);
      setIsDrawer(true);
      setGameState((prev: any) => ({ ...prev, phase: 'word_selection' }));
    });

    // round_start — non-drawers get this
    socket.on('round_start', ({ drawerId, drawerName, round, totalRounds }: any) => {
      setIsDrawer(false);
      setCurrentWord('');
      setCurrentHint('');
      setGameState({ phase: 'waiting_for_word', drawerId, drawerName, round, totalRounds });
      setShouldClearCanvas(true);
      setTimeout(() => setShouldClearCanvas(false), 100);
    });

    // drawing_start — both drawer and others get this
    socket.on('drawing_start', ({ word, hint, drawerId, drawerName, drawTime }: any) => {
      setTimeLeft(drawTime);
      setCurrentHint(hint || '');
      if (word) {
        setCurrentWord(word); // only drawer gets actual word
        setGameState((prev: any) => ({ ...prev, phase: 'drawing', word }));
      } else {
        setCurrentWord('');
        setGameState((prev: any) => ({ ...prev, phase: 'drawing', drawerId, drawerName }));
      }
      setShouldClearCanvas(true);
      setTimeout(() => setShouldClearCanvas(false), 100);
    });

    socket.on('next_round', ({ round, totalRounds, drawerId, drawerName, players }: any) => {
      setPlayers(players);
      setGameState({ phase: 'waiting', round, totalRounds, drawerId, drawerName });
      setCurrentWord('');
      setCurrentHint('');
      setWordOptions([]);
    });

    socket.on('round_end', ({ word, players, round, totalRounds }: any) => {
      setPlayers(players);
      setCurrentWord(word);
      setGameState((prev: any) => ({ ...prev, phase: 'round_end', word, round, totalRounds }));
    });

    socket.on('game_over', ({ winner, leaderboard }: any) => {
      setPlayers(leaderboard);
      setGameState((prev: any) => ({ ...prev, phase: 'game_over', winner }));
    });

    socket.on('timer_update', ({ timeLeft: t }: any) => setTimeLeft(t));

    socket.on('hint_update', ({ hint }: any) => setCurrentHint(hint));

    // Drawing events
    socket.on('draw_data', (data: any) => setDrawData(data));

    socket.on('canvas_cleared', () => {
      setShouldClearCanvas(true);
      setTimeout(() => setShouldClearCanvas(false), 100);
    });

    socket.on('draw_undo', ({ strokes }: any) => {
      setUndoStrokes(strokes || []);
    });

    // Chat & guess events
    socket.on('chat_message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('guess_result', ({ correct, playerId, playerName, points, players: updatedPlayers }: any) => {
      if (correct && updatedPlayers) setPlayers(updatedPlayers);
    });

    socket.on('error', ({ message }: any) => alert('Error: ' + message));

    return () => { socket.disconnect(); };
  }, []);

  // Actions
  const createRoom = useCallback((playerName: string, settings: any) => {
    socketRef.current?.emit('create_room', { playerName, settings });
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    socketRef.current?.emit('join_room', { roomCode, playerName });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('start_game', {});
  }, []);

  const chooseWord = useCallback((word: string) => {
    socketRef.current?.emit('word_chosen', { word });
    setCurrentWord(word);
    setWordOptions([]);
    setGameState((prev: any) => ({ ...prev, phase: 'drawing', word }));
  }, []);

  const sendDrawStart = useCallback((x: number, y: number, color: string, size: number) => {
    socketRef.current?.emit('draw_start', { x, y, color, size });
  }, []);

  const sendDrawMove = useCallback((x: number, y: number) => {
    socketRef.current?.emit('draw_move', { x, y });
  }, []);

  const sendDrawEnd = useCallback(() => {
    socketRef.current?.emit('draw_end', {});
  }, []);

  const clearCanvas = useCallback(() => {
    socketRef.current?.emit('canvas_clear', {});
    setShouldClearCanvas(true);
    setTimeout(() => setShouldClearCanvas(false), 100);
  }, []);

  const undoStroke = useCallback(() => {
    socketRef.current?.emit('draw_undo', {});
  }, []);

  const sendGuess = useCallback((text: string) => {
    socketRef.current?.emit('guess', { text });
  }, []);

  const sendChat = useCallback((text: string) => {
    socketRef.current?.emit('chat', { text });
  }, []);

  const setReady = useCallback(() => {}, []); // not used in backend

  return {
    connected, myId, isHost,
    roomId, roomCode, players, settings,
    gameState, wordOptions, messages,
    drawData, shouldClearCanvas, undoStrokes,
    timeLeft, isDrawer, currentWord, currentHint,
    createRoom, joinRoom, setReady, startGame,
    chooseWord, sendDrawStart, sendDrawMove,
    sendDrawEnd, clearCanvas, undoStroke,
    sendGuess, sendChat,
  };
};
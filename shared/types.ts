// Shared types between frontend and backend

export interface Player {
  id: string;
  username: string;
  balance: number;
  createdAt: Date;
}

export interface Bet {
  playerId: string;
  playerUsername: string;
  amount: number;
  timestamp: Date;
}

export interface Round {
  id: string;
  startTime: Date | null;
  endTime: Date | null;
  bets: Bet[];
  totalPool: number;
  winnerId?: string;
  winnerUsername?: string;
  winnerAmount?: number;
  casinoCommission?: number;
  status: 'waiting' | 'active' | 'finished';
}

export type RoomType = 'public' | 'private';
export type RoomStatus = 'waiting' | 'active' | 'closed';

export interface Room {
  id: string;
  name: string;
  maxPlayers: number;
  minBet: number;
  maxBet: number;
  roundDurationMs: number;
  type: RoomType;
  inviteCode?: string;
  creatorId: string;
  playerCount: number;
  status: RoomStatus;
  createdAt: Date;
}

export interface RoomConfig {
  roomId: string;
  roomName: string;
  roundDurationMs: number;
  casinoCommissionPercent: number;
  minBet: number;
  maxBet: number;
  maxPlayers: number;
  type: RoomType;
}

export interface GameConfig {
  roundDurationMs: number;
  casinoCommissionPercent: number;
  minBet: number;
  maxBet: number;
}

// WebSocket message types
export type WSMessageType = 
  | 'ROUND_UPDATE'
  | 'ROUND_WAITING'
  | 'BET_PLACED'
  | 'ROUND_END'
  | 'ROUND_START'
  | 'ROUND_RESULT_NOTIFICATION'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'PLAYER_JOINED_ROOM'
  | 'PLAYER_LEFT_ROOM'
  | 'ERROR'
  | 'PLACE_BET'
  | 'JOIN_GAME'
  | 'JOIN_ROOM'
  | 'JOIN_ROOM_BY_CODE'
  | 'LEAVE_ROOM'
  | 'CREATE_ROOM'
  | 'CLOSE_ROOM'
  | 'ROOM_CREATED'
  | 'ROOM_JOINED'
  | 'ROOM_LEFT'
  | 'ROOM_CLOSED'
  | 'ROOM_LIST_UPDATE'
  | 'ROOMS_LIST'
  | 'GET_ROOMS'
  | 'SYNC_STATE'
  | 'CONNECTED';

export interface WSMessage<T = any> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

// Room-related payloads
export interface CreateRoomPayload {
  name: string;
  maxPlayers: number;
  minBet: number;
  maxBet: number;
  roundDurationMs: number;
}

export interface JoinRoomPayload {
  roomId: string;
}

export interface JoinRoomByCodePayload {
  inviteCode: string;
}

export interface RoomCreatedPayload {
  room: Room;
  currentRound: Round | null;
  config: RoomConfig;
}

export interface RoomJoinedPayload {
  room: Room;
  currentRound: Round | null;
  config: RoomConfig;
  playerId: string;
}

export interface PlayerJoinedRoomPayload {
  roomId: string;
  playerId: string;
  username: string;
  playerCount: number;
}

export interface PlayerLeftRoomPayload {
  roomId: string;
  playerId: string;
  username: string;
  playerCount: number;
}

export interface RoomClosedPayload {
  roomId: string;
  message: string;
}

export interface RoomsListPayload {
  rooms: Room[];
}

// Round-related payloads
export interface RoundUpdatePayload {
  roomId: string;
  round: Round;
  timeRemaining: number;
  players?: { id: string; username: string; avatar: string | null; totalBet: number }[];
}

export interface RoundWaitingPayload {
  roomId: string;
  round: Round;
  message: string;
}

export interface BetPlacedPayload {
  roomId: string;
  bet: Bet;
  round: Round;
}

export interface RoundEndPayload {
  roomId: string;
  round: Round;
  winner: {
    playerId: string;
    username: string;
    amountWon: number;
  };
  winningNumber: number;
}

export interface PlaceBetPayload {
  amount: number;
}

export interface JoinGamePayload {
  playerId?: string;
  username: string;
}

export interface SyncStatePayload {
  globalConfig: GameConfig;
  playerId?: string;
  currentRoom: {
    room: Room;
    currentRound: Round | null;
    config: RoomConfig;
  } | null;
  availableRooms: Room[];
}

export interface ConnectedPayload {
  message: string;
  username: string;
  rooms: Room[];
}

export interface ErrorPayload {
  message: string;
  code: string;
}

// Personal notification sent to players who placed bets when a round ends
export interface RoundResultNotificationPayload {
  roomId: string;
  roomName: string;
  roundId: string;
  isWinner: boolean;
  totalBet: number;
  amountWon: number;
  amountLost: number;
  netResult: number; // positive for win, negative for loss
  winnerUsername: string;
  totalPool: number;
  currentBalance: number;
}

export interface CloseRoomPayload {
  roomId: string;
}

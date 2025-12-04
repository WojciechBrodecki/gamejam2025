export interface Player {
  id: string;
  username: string;
  balance: number;
  avatar?: string | null;
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
  maxPlayers: number; // Max betters per round (private rooms always have 2)
  minBet: number;
  maxBet: number; // Max total bets per player in a round
  roundDurationMs: number;
  type: RoomType;
  inviteCode?: string;
  creatorId: string;
  playerCount: number; // People in room (spectators + players)
  currentBetterCount: number; // Players who bet in current round
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

export interface GameState {
  currentRound: Round | null;
  config: RoomConfig | null;
  players: Player[];
  playerId: string | null;
  currentRoom: Room | null;
  availableRooms: Room[];
}

export type WSMessageType = 
  | 'CONNECTED'
  | 'ROUND_WAITING'
  | 'ROUND_UPDATE'
  | 'BET_PLACED'
  | 'ROUND_END'
  | 'ROUND_START'
  | 'ROUND_RESULT_NOTIFICATION'
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
  | 'SYNC_STATE';

export interface WSMessage<T = any> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

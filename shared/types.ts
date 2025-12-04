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
  startTime: Date;
  endTime: Date;
  bets: Bet[];
  totalPool: number;
  winnerId?: string;
  winnerUsername?: string;
  winnerAmount?: number;
  casinoCommission?: number;
  status: 'active' | 'finished';
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
  | 'BET_PLACED'
  | 'ROUND_END'
  | 'ROUND_START'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'ERROR'
  | 'PLACE_BET'
  | 'JOIN_GAME'
  | 'SYNC_STATE';

export interface WSMessage<T = any> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

export interface RoundUpdatePayload {
  round: Round;
  timeRemaining: number;
}

export interface BetPlacedPayload {
  bet: Bet;
  round: Round;
}

export interface RoundEndPayload {
  round: Round;
  winner: {
    playerId: string;
    username: string;
    amountWon: number;
  };
}

export interface PlaceBetPayload {
  amount: number;
  playerId: string;
}

export interface JoinGamePayload {
  playerId: string;
  username: string;
}

export interface SyncStatePayload {
  currentRound: Round | null;
  config: GameConfig;
  players: Player[];
}

export interface ErrorPayload {
  message: string;
  code: string;
}

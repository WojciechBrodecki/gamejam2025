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
  startTime: Date;
  endTime: Date;
  bets: Bet[];
  totalPool: number;
  winnerId?: string;
  winnerUsername?: string;
  winnerAmount?: number;
  casinoCommission?: number;
  status: 'waiting' | 'active' | 'finished';
}

export interface GameConfig {
  roundDurationMs: number;
  casinoCommissionPercent: number;
  minBet: number;
  maxBet: number;
}

export interface GameState {
  currentRound: Round | null;
  config: GameConfig | null;
  players: Player[];
  playerId: string | null;
}

export type WSMessageType = 
  | 'CONNECTED'
  | 'ROUND_WAITING'
  | 'ROUND_UPDATE'
  | 'BET_PLACED'
  | 'ROUND_END'
  | 'ROUND_START'
  | 'ERROR'
  | 'PLACE_BET'
  | 'JOIN_GAME'
  | 'SYNC_STATE';

export interface WSMessage<T = any> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

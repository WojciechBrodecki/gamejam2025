import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  mongodbUri: string;
  roundDurationMs: number;
  roundDelayMs: number;
  casinoCommissionPercent: number;
  minBet: number;
  maxBet: number;
  jwtSecret: string;
  maxPrivateRoomsPerPlayer: number;
}

export const config: Config = {
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/casino',
  roundDurationMs: parseInt(process.env.ROUND_DURATION_MS || 10*1000+ "", 10),
  roundDelayMs: parseInt(process.env.ROUND_DELAY_MS || '5000', 10), // 5s delay between rounds
  casinoCommissionPercent: parseFloat(process.env.CASINO_COMMISSION_PERCENT || '5'),
  minBet: parseInt(process.env.MIN_BET || '1', 10),
  maxBet: parseInt(process.env.MAX_BET || '10000', 10),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
  maxPrivateRoomsPerPlayer: parseInt(process.env.MAX_PRIVATE_ROOMS_PER_PLAYER || '2', 10),
};

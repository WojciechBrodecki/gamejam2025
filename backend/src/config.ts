import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  port: number;
  mongodbUri: string;
  roundDurationMs: number;
  casinoCommissionPercent: number;
  minBet: number;
  maxBet: number;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/casino',
  roundDurationMs: parseInt(process.env.ROUND_DURATION_MS || '60000', 10),
  casinoCommissionPercent: parseFloat(process.env.CASINO_COMMISSION_PERCENT || '5'),
  minBet: parseInt(process.env.MIN_BET || '1', 10),
  maxBet: parseInt(process.env.MAX_BET || '10000', 10),
};

import mongoose, { Schema, Document } from 'mongoose';

export interface IBet {
  id: string;
  playerId: string;
  playerUsername: string;
  amount: number;
  timestamp: Date;
}

export interface IRound extends Document {
  id: string;
  startTime: Date | null;
  endTime: Date | null;
  bets: IBet[];
  totalPool: number;
  winnerId?: string;
  winnerUsername?: string;
  winnerAmount?: number;
  casinoCommission?: number;
  status: 'waiting' | 'active' | 'finished';
}

const BetSchema: Schema = new Schema({
  id: { type: String, required: true },
  playerId: { type: String, required: true },
  playerUsername: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const RoundSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  bets: [BetSchema],
  totalPool: { type: Number, default: 0 },
  winnerId: { type: String },
  winnerUsername: { type: String },
  winnerAmount: { type: Number },
  casinoCommission: { type: Number },
  status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
});

export const Round = mongoose.model<IRound>('Round', RoundSchema);

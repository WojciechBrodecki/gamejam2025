import mongoose, { Schema, Document } from 'mongoose';

export interface IBet {
  playerId: string;
  playerUsername: string;
  amount: number;
  timestamp: Date;
}

export interface IRound extends Document {
  id: string;
  startTime: Date;
  endTime: Date;
  bets: IBet[];
  totalPool: number;
  winnerId?: string;
  winnerUsername?: string;
  winnerAmount?: number;
  casinoCommission?: number;
  status: 'active' | 'finished';
}

const BetSchema: Schema = new Schema({
  playerId: { type: String, required: true },
  playerUsername: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const RoundSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  bets: [BetSchema],
  totalPool: { type: Number, default: 0 },
  winnerId: { type: String },
  winnerUsername: { type: String },
  winnerAmount: { type: Number },
  casinoCommission: { type: Number },
  status: { type: String, enum: ['active', 'finished'], default: 'active' },
});

export const Round = mongoose.model<IRound>('Round', RoundSchema);

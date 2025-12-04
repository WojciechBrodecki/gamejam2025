import mongoose, { Schema, Document } from 'mongoose';
import { IRound } from './Round';

export type RoomType = 'public' | 'private';

export interface IRoom extends Document {
  id: string;
  name: string;
  maxPlayers: number;
  minBet: number;
  maxBet: number;
  roundDurationMs: number; // Round duration in milliseconds per room
  type: RoomType;
  inviteCode?: string; // Required for private rooms
  creatorId: string;
  playerIds: string[];
  currentRoundId?: string;
  status: 'waiting' | 'active' | 'closed';
  createdAt: Date;
}

const RoomSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  maxPlayers: { type: Number, required: true, min: 2, max: 100 },
  minBet: { type: Number, required: true, min: 1 },
  maxBet: { type: Number, required: true },
  roundDurationMs: { type: Number, required: true, min: 10000 }, // Min 10 seconds
  type: { type: String, enum: ['public', 'private'], required: true },
  inviteCode: { type: String, sparse: true }, // Only for private rooms
  creatorId: { type: String, required: true },
  playerIds: [{ type: String }],
  currentRoundId: { type: String },
  status: { type: String, enum: ['waiting', 'active', 'closed'], default: 'waiting' },
  createdAt: { type: Date, default: Date.now },
});

// Index for quick lookup of public rooms
RoomSchema.index({ type: 1, status: 1 });
// Index for invite code lookup
RoomSchema.index({ inviteCode: 1 }, { sparse: true });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);


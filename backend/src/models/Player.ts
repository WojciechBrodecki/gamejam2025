import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  id: string;
  username: string;
  balance: number;
  avatar?: string; // Base64 encoded image (320x320)
  createdAt: Date;
}

const PlayerSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  balance: { type: Number, default: 1000 },
  avatar: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const Player = mongoose.model<IPlayer>('Player', PlayerSchema);

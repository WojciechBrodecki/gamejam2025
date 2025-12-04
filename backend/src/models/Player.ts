import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  id: string;
  username: string;
  balance: number;
  createdAt: Date;
}

const PlayerSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  balance: { type: Number, default: 1000 },
  createdAt: { type: Date, default: Date.now },
});

export const Player = mongoose.model<IPlayer>('Player', PlayerSchema);

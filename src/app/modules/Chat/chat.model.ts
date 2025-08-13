import mongoose, { Schema, Model } from 'mongoose';
import { IChat } from './chat.interface';

const ChatSchema = new Schema<IChat>(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    senderName: { type: String },
    imageUrl: { type: String },
  },
  {
    timestamps: true,
  },
);

const ChatModel: Model<IChat> =
  mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);

export default ChatModel;

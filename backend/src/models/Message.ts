import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageReaction {
  emoji: string;
  userId: mongoose.Types.ObjectId;
  timestamp: string;
}

export interface IMessageAttachment {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name?: string;
  size?: string;
  duration?: number;
}

export interface IMessage extends Document {
  coupleId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'sticker';
  attachments: IMessageAttachment[];
  reactions: IMessageReaction[];
  replyToId?: mongoose.Types.ObjectId;
  replyToContent?: string;
  replyToSenderName?: string;
  isPinned: boolean;
  isFavorite: boolean;
  isRead: boolean;
  isDelivered: boolean;
  status: 'sent' | 'delivered' | 'read';
  deliveredAt?: Date;
  readAt?: Date;
  isEdited: boolean;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, default: '' },
    type: { type: String, enum: ['text', 'image', 'video', 'voice', 'sticker'], default: 'text' },
    attachments: [
      {
        type: { type: String, enum: ['image', 'video', 'audio', 'file'] },
        url: { type: String, required: true },
        name: { type: String },
        size: { type: String },
        duration: { type: Number },
      },
    ],
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: String, default: () => new Date().toISOString() },
      },
    ],
    replyToId: { type: Schema.Types.ObjectId, ref: 'Message' },
    replyToContent: { type: String },
    replyToSenderName: { type: String },
    isPinned: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent', index: true },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    isEdited: { type: Boolean, default: false },
    idempotencyKey: { type: String, sparse: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.senderId = ret.senderId?.toString();
        ret.receiverId = ret.receiverId?.toString();
        ret.coupleId = ret.coupleId?.toString();
        if (ret.replyToId) ret.replyToId = ret.replyToId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

messageSchema.index({ coupleId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);

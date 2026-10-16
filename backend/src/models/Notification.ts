import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'message_reaction'
  | 'memory_added'
  | 'song_added'
  | 'place_added'
  | 'birthday_soon'
  | 'date_soon'
  | 'letter_written'
  | 'bucket_completed'
  | 'story_added'
  | 'post_reaction';

export interface INotification extends Document {
  coupleId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  description: string;
  isRead: boolean;
  avatar?: string;
  linkUrl?: string;
  actionText?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    avatar: { type: String },
    linkUrl: { type: String },
    actionText: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.timestamp = ret.createdAt?.toISOString();
        ret.coupleId = ret.coupleId?.toString();
        ret.recipientId = ret.recipientId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);

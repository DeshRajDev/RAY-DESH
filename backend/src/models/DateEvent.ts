import mongoose, { Schema, Document } from 'mongoose';

export type DateEventType = 'Anniversary' | 'Birthday' | 'Trip' | 'First Date' | 'First Message' | 'Special' | 'Custom';

export interface IDateEvent extends Document {
  coupleId: mongoose.Types.ObjectId;
  title: string;
  date: string;
  type: DateEventType;
  description?: string;
  location?: string;
  isRecurringYearly: boolean;
  remindDaysBefore: number[];
  photos?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dateEventSchema = new Schema<IDateEvent>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    type: {
      type: String,
      enum: ['Anniversary', 'Birthday', 'Trip', 'First Date', 'First Message', 'Special', 'Custom'],
      default: 'Special',
    },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    isRecurringYearly: { type: Boolean, default: false },
    remindDaysBefore: [{ type: Number }],
    photos: [{ type: String }],
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.coupleId = ret.coupleId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

dateEventSchema.index({ coupleId: 1, date: 1 });

export const DateEvent = mongoose.model<IDateEvent>('DateEvent', dateEventSchema);

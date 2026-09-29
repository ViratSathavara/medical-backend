import mongoose, { Schema, Document } from 'mongoose';

export interface IAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  subject?: string;
  content: string;
  attachments: IAttachment[];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    fileName: String,
    fileUrl: String,
    fileType: String
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subject: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      required: true
    },
    attachments: [AttachmentSchema],
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: Date
  },
  {
    timestamps: true
  }
);

MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

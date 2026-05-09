import mongoose, { Schema, Document } from 'mongoose';

export enum SessionStatus {
  INITIALIZING = 'INITIALIZING',
  QR_READY = 'QR_READY',
  AUTHENTICATED = 'AUTHENTICATED',
  READY = 'READY',
  DISCONNECTED = 'DISCONNECTED',
  FAILED = 'FAILED',
}

export interface IWhatsAppSession extends Document {
  organizationId: mongoose.Types.ObjectId;
  sessionId: string; // Unique ID for this specific number (e.g., 'sales-1')
  phoneNumber?: string;
  name: string;
  status: SessionStatus;
  lastActive: Date;
  settings: {
    autoReply: boolean;
    aiEnabled: boolean;
    typingDelay: {
      min: number;
      max: number;
    };
  };
}

const WhatsAppSessionSchema: Schema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  sessionId: { type: String, required: true },
  phoneNumber: { type: String },
  name: { type: String, required: true },
  status: { type: String, enum: Object.values(SessionStatus), default: SessionStatus.INITIALIZING },
  lastActive: { type: Date, default: Date.now },
  settings: {
    autoReply: { type: Boolean, default: true },
    aiEnabled: { type: Boolean, default: false },
    typingDelay: {
      min: { type: Number, default: 2000 },
      max: { type: Number, default: 5000 },
    },
  },
});

// Ensure sessionId is unique per organization
WhatsAppSessionSchema.index({ organizationId: 1, sessionId: 1 }, { unique: true });

export default mongoose.model<IWhatsAppSession>('WhatsAppSession', WhatsAppSessionSchema);

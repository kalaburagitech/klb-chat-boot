import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerState extends Document {
  organizationId: mongoose.Types.ObjectId;
  phoneNumber: string;
  sessionId: string;
  currentFlowId?: string;
  previousFlowId?: string;
  conversationState: 'ACTIVE' | 'IDLE' | 'COMPLETED' | 'EXPIRED';
  lastInteractionAt: Date;
  sessionStartedAt: Date;
  metadata: any;
}

const CustomerStateSchema: Schema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  phoneNumber: { type: String, required: true },
  sessionId: { type: String, required: true },
  currentFlowId: { type: String },
  previousFlowId: { type: String },
  conversationState: { type: String, enum: ['ACTIVE', 'IDLE', 'COMPLETED', 'EXPIRED'], default: 'ACTIVE' },
  lastInteractionAt: { type: Date, default: Date.now },
  sessionStartedAt: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed, default: {} },
});

// Ensure unique state per customer per number
CustomerStateSchema.index({ organizationId: 1, phoneNumber: 1, sessionId: 1 }, { unique: true });

export default mongoose.model<ICustomerState>('CustomerState', CustomerStateSchema);

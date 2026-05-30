import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsLog extends Document {
  organizationId: string;
  phoneNumber: string;
  sessionId: string;
  event: 'NEW_CONVERSATION' | 'MENU_USAGE' | 'FAILED_INPUT' | 'KEYWORD_MATCH';
  metadata: any;
  createdAt: Date;
}

const AnalyticsLogSchema: Schema = new Schema({
  organizationId: { type: String, required: true, index: true },
  phoneNumber: { type: String, required: true },
  sessionId: { type: String, required: true },
  event: { 
    type: String, 
    enum: ['NEW_CONVERSATION', 'MENU_USAGE', 'FAILED_INPUT', 'KEYWORD_MATCH'], 
    required: true 
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAnalyticsLog>('AnalyticsLog', AnalyticsLogSchema);

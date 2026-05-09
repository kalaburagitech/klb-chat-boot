import mongoose, { Schema, Document } from 'mongoose';

export enum ReplyType {
  TEXT = 'TEXT',
  MEDIA = 'MEDIA',
  AI = 'AI',
}

export interface IChatbotRule extends Document {
  organizationId: mongoose.Types.ObjectId;
  sessionId: string;
  trigger: string;
  type: ReplyType;
  response: string;
  mediaUrl?: string;
  enabled: boolean;
}

const ChatbotRuleSchema: Schema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  sessionId: { type: String, required: true },
  trigger: { type: String, required: true },
  type: { type: String, enum: Object.values(ReplyType), default: ReplyType.TEXT },
  response: { type: String, required: true },
  mediaUrl: { type: String },
  enabled: { type: Boolean, default: true },
});

export default mongoose.model<IChatbotRule>('ChatbotRule', ChatbotRuleSchema);

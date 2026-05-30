import mongoose, { Schema, Document } from 'mongoose';

export interface IAutoReplyRule extends Document {
  organizationId: string;
  keyword: string;
  replyType: 'TEXT' | 'TEMPLATE' | 'MENU' | 'MEDIA' | 'DOCUMENTATION';
  replyContent: string; // The raw text, or ID of template/menu
  mediaUrl?: string; // Optional URL if it's media/documentation
  matchType: 'EXACT' | 'CONTAINS';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AutoReplyRuleSchema: Schema = new Schema({
  organizationId: { type: String, required: true, index: true },
  keyword: { type: String, required: true },
  replyType: { 
    type: String, 
    enum: ['TEXT', 'TEMPLATE', 'MENU', 'MEDIA', 'DOCUMENTATION'], 
    required: true 
  },
  replyContent: { type: String, required: true },
  mediaUrl: { type: String },
  matchType: { type: String, enum: ['EXACT', 'CONTAINS'], default: 'EXACT' },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model<IAutoReplyRule>('AutoReplyRule', AutoReplyRuleSchema);

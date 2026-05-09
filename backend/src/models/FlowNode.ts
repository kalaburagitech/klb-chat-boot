import mongoose, { Schema, Document } from 'mongoose';

export enum FlowNodeType {
  MESSAGE = 'MESSAGE',
  MENU = 'MENU',
  MEDIA = 'MEDIA',
  ACTION = 'ACTION',
}

export interface IFlowOption {
  label: string;
  keyword: string;
  nextFlowId?: string; // Links to another FlowNode
}

export interface IFlowNode extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  type: FlowNodeType;
  triggerKeywords: string[]; // Keywords to start this specific flow (root level)
  content: string;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'PDF' | 'VIDEO';
  options: IFlowOption[];
  parentFlowId?: string;
  isRoot: boolean;
}

const FlowOptionSchema = new Schema({
  label: { type: String, required: true },
  keyword: { type: String, required: true },
  nextFlowId: { type: String },
});

const FlowNodeSchema: Schema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(FlowNodeType), default: FlowNodeType.MESSAGE },
  triggerKeywords: [{ type: String }],
  content: { type: String, required: true },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['IMAGE', 'PDF', 'VIDEO'] },
  options: [FlowOptionSchema],
  parentFlowId: { type: String },
  isRoot: { type: Boolean, default: false },
});

// Index for quick lookup
FlowNodeSchema.index({ organizationId: 1, triggerKeywords: 1 });
FlowNodeSchema.index({ organizationId: 1, isRoot: 1 });

export default mongoose.model<IFlowNode>('FlowNode', FlowNodeSchema);

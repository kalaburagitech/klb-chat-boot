import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  organizationId: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema = new Schema({
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  content: { type: String, required: true },
  variables: [{ type: String }],
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Ensure unique template name per organization
TemplateSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export default mongoose.model<ITemplate>('Template', TemplateSchema);

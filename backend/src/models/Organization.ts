import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  apiKey: string;
  settings: {
    conversationTimeoutMinutes: number;
    typingDelay: { min: number; max: number };
  };
  createdAt: Date;
}

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  apiKey: { type: String, required: true, unique: true },
  settings: {
    conversationTimeoutMinutes: { type: Number, default: 5 },
    typingDelay: {
      min: { type: Number, default: 2000 },
      max: { type: Number, default: 5000 }
    }
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);

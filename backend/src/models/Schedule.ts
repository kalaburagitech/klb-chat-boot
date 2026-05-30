import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  organizationId: string;
  name: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';
  cronExpression?: string; // Used for recurring schedules
  executeAt?: Date; // Used for ONCE schedules
  templateId?: string; // Template to use for the message
  messageContent?: string; // Raw message if not using template
  targetGroup: 'ALL_CUSTOMERS' | 'SPECIFIC_NUMBERS';
  targetNumbers?: string[]; // Array of phone numbers if SPECIFIC_NUMBERS
  active: boolean;
  lastRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema: Schema = new Schema({
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'ONCE'], required: true },
  cronExpression: { type: String },
  executeAt: { type: Date },
  templateId: { type: Schema.Types.ObjectId, ref: 'Template' },
  messageContent: { type: String },
  targetGroup: { type: String, enum: ['ALL_CUSTOMERS', 'SPECIFIC_NUMBERS'], required: true },
  targetNumbers: [{ type: String }],
  active: { type: Boolean, default: true },
  lastRunAt: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model<ISchedule>('Schedule', ScheduleSchema);

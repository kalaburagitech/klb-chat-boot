import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuOption {
  keyword: string;
  label: string;
  action: 'NEXT_MENU' | 'SEND_TEMPLATE' | 'TRIGGER_FLOW';
  targetId?: string; // target menu ID or template ID
}

export interface IMenu extends Document {
  organizationId: string;
  title: string;
  content: string; // The text to display before options
  options: IMenuOption[];
  parentMenuId?: string; // If this is a submenu
  isRoot: boolean; // Whether this is the starting main menu
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuSchema: Schema = new Schema({
  organizationId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  options: [{
    keyword: { type: String, required: true },
    label: { type: String, required: true },
    action: { type: String, enum: ['NEXT_MENU', 'SEND_TEMPLATE', 'TRIGGER_FLOW'], required: true },
    targetId: { type: String }
  }],
  parentMenuId: { type: Schema.Types.ObjectId, ref: 'Menu' },
  isRoot: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model<IMenu>('Menu', MenuSchema);

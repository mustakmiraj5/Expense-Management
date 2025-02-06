import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt fields
export class Expense extends Document {
  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: String })
  category: string;

  @Prop({ required: true, type: Date })
  date: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
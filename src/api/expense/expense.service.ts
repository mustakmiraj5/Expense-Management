import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Expense } from './schema/expense.schema';
import { Model } from 'mongoose';

@Injectable()
export class ExpenseService {
    constructor(@InjectModel(Expense.name) private expenseModel: Model<Expense>) {}

    // Create a new expense
    async createExpense(
        amount: number,
        description: string,
        category: string,
        date: Date,
    ): Promise<Expense> {
        return this.expenseModel.create({ amount, description, category, date });
    }

    // Get all expenses
    async getAllExpenses(): Promise<Expense[]> {
        return this.expenseModel.find().exec();
    }
}

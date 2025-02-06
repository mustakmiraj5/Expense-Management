import { Body, Controller, Get, Post } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { Expense } from './schema/expense.schema';

@Controller('expense')
export class ExpenseController {
    constructor(private readonly expenseService: ExpenseService) {}

    // Add a new expense
    @Post('add')
    async createExpense(
        @Body('amount') amount: number,
        @Body('description') description: string,
        @Body('category') category: string,
        @Body('date') date: Date,
    ): Promise<Expense> {
        return this.expenseService.createExpense(amount, description, category, date);
    }

    // Get all expenses from the database
    @Get()
    async getAllExpenses() {
        return this.expenseService.getAllExpenses();
    }
}

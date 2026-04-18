import { IsDateString, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsInt()
  categoryId: number;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

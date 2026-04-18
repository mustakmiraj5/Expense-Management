import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateIncomeDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

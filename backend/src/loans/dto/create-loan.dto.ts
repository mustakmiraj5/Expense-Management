import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { LoanDirection } from '@prisma/client';

export class CreateLoanDto {
  @IsEnum(LoanDirection)
  direction: LoanDirection;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  principal: number;

  @IsInt()
  contactId: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

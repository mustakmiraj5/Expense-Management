import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateLoanDto } from './create-loan.dto';

export class UpdateLoanDto extends PartialType(OmitType(CreateLoanDto, ['direction'] as const)) {}

import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum MilestoneStatusDto {
  PLANNED = 'PLANNED',
  ACHIEVED = 'ACHIEVED',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED',
}

export class CreateMilestoneDto {
  @IsNumber()
  projectId!: number;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  plannedDate!: string;

  @IsOptional()
  @IsDateString()
  actualDate?: string;

  @IsOptional()
  @IsEnum(MilestoneStatusDto)
  status?: MilestoneStatusDto;
}
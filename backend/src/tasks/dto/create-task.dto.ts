import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum TaskStatusDto {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriorityDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateTaskDto {
  @IsNumber()
  projectId!: number;

  @IsOptional()
  @IsNumber()
  wbsItemId?: number;

  @IsOptional()
  @IsNumber()
  parentTaskId?: number;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatusDto)
  status?: TaskStatusDto;

  @IsOptional()
  @IsEnum(TaskPriorityDto)
  priority?: TaskPriorityDto;

  @IsOptional()
  @IsDateString()
  plannedStart?: string;

  @IsOptional()
  @IsDateString()
  plannedEnd?: string;

  @IsOptional()
  @IsDateString()
  actualStart?: string;

  @IsOptional()
  @IsDateString()
  actualEnd?: string;

  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsNumber()
  assignedToId?: number;
}
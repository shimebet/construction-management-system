import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWbsItemDto {
  @IsNumber()
  projectId!: number;

  @IsOptional()
  @IsNumber()
  parentId?: number;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
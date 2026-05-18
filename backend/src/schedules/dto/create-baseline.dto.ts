import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBaselineDto {
  @IsNumber()
  projectId!: number;

  @IsString()
  name!: string;

  @IsString()
  version!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
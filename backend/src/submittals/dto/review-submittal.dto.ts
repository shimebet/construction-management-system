import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubmittalStatusDto } from './create-submittal.dto';

export class ReviewSubmittalDto {
  @IsEnum(SubmittalStatusDto)
  status!: SubmittalStatusDto;

  @IsOptional()
  @IsString()
  comments?: string;
}
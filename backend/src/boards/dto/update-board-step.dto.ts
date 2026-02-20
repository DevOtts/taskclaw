import {
  IsString,
  IsOptional,
  IsInt,
} from 'class-validator';

export class UpdateBoardStepDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  step_type?: string;
}

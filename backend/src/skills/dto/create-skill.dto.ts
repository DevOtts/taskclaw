import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  @MaxLength(51200) // 50KB limit
  instructions: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

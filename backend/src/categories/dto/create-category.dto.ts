import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string; // Hex color (e.g., "#3B82F6")

  @IsOptional()
  @IsString()
  icon?: string; // Lucide icon name or emoji

  @IsOptional()
  @IsBoolean()
  visible?: boolean; // Whether category shows in the board (default true)
}

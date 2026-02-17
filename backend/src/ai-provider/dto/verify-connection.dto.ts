import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class VerifyConnectionDto {
  @IsString()
  @IsNotEmpty()
  api_url: string;

  @IsString()
  @IsOptional()
  api_key?: string;

  @IsString()
  @IsOptional()
  agent_id?: string;
}

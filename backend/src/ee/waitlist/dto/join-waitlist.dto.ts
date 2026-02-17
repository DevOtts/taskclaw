import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JoinWaitlistDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  source?: string;
}

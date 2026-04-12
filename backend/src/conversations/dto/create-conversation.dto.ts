import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsUUID()
  @IsOptional()
  task_id?: string; // Optional: Link conversation to a task

  @IsUUID()
  @IsOptional()
  board_id?: string; // Optional: Link conversation to a board (board-level AI chat)

  @IsUUID()
  @IsOptional()
  pod_id?: string; // Optional: Link conversation to a pod

  @IsBoolean()
  @IsOptional()
  is_workspace?: boolean; // Optional: Mark as workspace-level conversation

  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  skill_ids?: string[]; // Optional: Selected skills for this conversation
}

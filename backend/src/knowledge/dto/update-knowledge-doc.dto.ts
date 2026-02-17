import { PartialType } from '@nestjs/mapped-types';
import { CreateKnowledgeDocDto } from './create-knowledge-doc.dto';

export class UpdateKnowledgeDocDto extends PartialType(CreateKnowledgeDocDto) {}

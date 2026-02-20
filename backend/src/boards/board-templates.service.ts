import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseAdminService } from '../supabase/supabase-admin.service';
import { AccessControlHelper } from '../common/helpers/access-control.helper';
import { InstallTemplateDto } from './dto/install-template.dto';

@Injectable()
export class BoardTemplatesService {
  private readonly logger = new Logger(BoardTemplatesService.name);

  constructor(
    private readonly supabaseAdmin: SupabaseAdminService,
    private readonly accessControl: AccessControlHelper,
  ) {}

  async findAll() {
    const client = this.supabaseAdmin.getClient();

    const { data, error } = await client
      .from('board_templates')
      .select('*')
      .or('is_system.eq.true,is_published.eq.true')
      .order('install_count', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch board templates: ${error.message}`);
    }

    return data;
  }

  async findOne(templateId: string) {
    const client = this.supabaseAdmin.getClient();

    const { data, error } = await client
      .from('board_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Board template with ID ${templateId} not found`);
    }

    return data;
  }

  async install(userId: string, accountId: string, dto: InstallTemplateDto) {
    const client = this.supabaseAdmin.getClient();
    await this.accessControl.verifyAccountAccess(client, accountId, userId);

    const template = await this.findOne(dto.template_id);
    const manifest = template.manifest;

    // Create board instance from template
    const { data: board, error: boardError } = await client
      .from('board_instances')
      .insert({
        account_id: accountId,
        template_id: template.id,
        name: dto.name || template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        tags: template.tags,
        installed_manifest: manifest,
        installed_version: template.version,
        latest_available_version: template.version,
        settings_override: manifest.settings || {},
      })
      .select()
      .single();

    if (boardError) {
      throw new Error(`Failed to install board template: ${boardError.message}`);
    }

    // Create steps from manifest
    if (manifest.steps && manifest.steps.length > 0) {
      const stepRows = manifest.steps.map((step: any) => ({
        board_instance_id: board.id,
        step_key: step.id,
        name: step.name,
        step_type: step.type,
        position: step.position,
        color: step.color || null,
        ai_enabled: step.ai_config?.enabled || false,
        ai_first: step.ai_config?.ai_first || false,
        system_prompt: step.ai_config?.system_prompt || null,
        model_override: step.ai_config?.model_override || null,
        temperature: step.ai_config?.temperature || null,
        input_fields: step.fields?.inputs || [],
        output_fields: step.fields?.outputs || [],
        on_complete_step_key: step.on_complete || null,
        on_error_step_key: step.on_error || null,
        routing_rules: step.routing_rules || [],
      }));

      const { error: stepsError } = await client
        .from('board_steps')
        .insert(stepRows);

      if (stepsError) {
        this.logger.error(`Failed to create template steps: ${stepsError.message}`);
      }
    }

    // Increment install count
    await client
      .from('board_templates')
      .update({ install_count: template.install_count + 1 })
      .eq('id', template.id);

    // Return full board with steps
    const { data: fullBoard } = await client
      .from('board_instances')
      .select('*, board_steps(id, step_key, name, step_type, position, color)')
      .eq('id', board.id)
      .single();

    if (fullBoard?.board_steps) {
      fullBoard.board_steps.sort((a: any, b: any) => a.position - b.position);
    }

    return fullBoard;
  }
}

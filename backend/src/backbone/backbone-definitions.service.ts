import { Injectable, Logger } from '@nestjs/common';
import { BackboneAdapterRegistry } from './adapters/backbone-adapter.registry';

/**
 * BackboneDefinitionsService (F009)
 *
 * Returns the catalogue of available backbone types so the frontend
 * can render a "pick your backbone" UI without hard-coding slugs.
 */

export interface BackboneDefinition {
  slug: string;
  label: string;
  description: string;
  /** Config fields the frontend should render (informational) */
  configSchema: BackboneConfigField[];
}

export interface BackboneConfigField {
  key: string;
  label: string;
  type: 'string' | 'url' | 'secret' | 'number' | 'boolean' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[]; // for 'select' type
}

/**
 * Static catalogue.  In the future this could move to the DB, but for now
 * the set of supported backbones is compile-time knowledge.
 */
const BACKBONE_DEFINITIONS: BackboneDefinition[] = [
  {
    slug: 'openclaw',
    label: 'OpenClaw',
    description:
      'Connect to a self-hosted OpenClaw instance via WebSocket protocol.',
    configSchema: [
      {
        key: 'api_url',
        label: 'API URL',
        type: 'url',
        required: true,
        placeholder: 'https://your-openclaw.example.com',
      },
      {
        key: 'api_key',
        label: 'API Key',
        type: 'secret',
        required: true,
        placeholder: 'sk-...',
      },
      {
        key: 'agent_id',
        label: 'Agent ID',
        type: 'string',
        required: false,
        placeholder: 'Optional default agent',
      },
    ],
  },
  // -- Future adapters will be added here by other agents --
  // { slug: 'openai', ... },
  // { slug: 'anthropic', ... },
];

@Injectable()
export class BackboneDefinitionsService {
  private readonly logger = new Logger(BackboneDefinitionsService.name);

  constructor(private readonly registry: BackboneAdapterRegistry) {}

  /**
   * Return all known backbone definitions.
   * Only includes definitions whose adapter is actually registered.
   */
  findAll(): BackboneDefinition[] {
    return BACKBONE_DEFINITIONS.filter((def) => this.registry.has(def.slug));
  }

  /**
   * Return all definitions regardless of adapter registration status.
   * Useful for the admin UI to show what could be configured.
   */
  findAllIncludingUnavailable(): BackboneDefinition[] {
    return BACKBONE_DEFINITIONS.map((def) => ({
      ...def,
      available: this.registry.has(def.slug),
    })) as any;
  }

  /**
   * Get a single definition by slug
   */
  findBySlug(slug: string): BackboneDefinition | undefined {
    return BACKBONE_DEFINITIONS.find((d) => d.slug === slug);
  }
}

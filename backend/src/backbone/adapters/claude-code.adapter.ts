import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  BackboneAdapter,
  BackboneSendOptions,
  BackboneSendResult,
  BackboneHealthResult,
} from './backbone-adapter.interface';

/**
 * ClaudeCodeAdapter (F025)
 *
 * Adapter for the Anthropic Messages API (Claude models).
 * Uses the /v1/messages endpoint with Anthropic-specific headers.
 */
@Injectable()
export class ClaudeCodeAdapter implements BackboneAdapter {
  readonly slug = 'claude-code';
  private readonly logger = new Logger(ClaudeCodeAdapter.name);

  validateConfig(config: Record<string, any>): void {
    if (!config.api_url) {
      throw new BadRequestException(
        'claude-code: "api_url" is required (e.g. https://api.anthropic.com)',
      );
    }
    if (!config.api_key) {
      throw new BadRequestException('claude-code: "api_key" is required');
    }
  }

  supportsNativeSkillInjection(): boolean {
    return false;
  }

  transformSystemPrompt(
    prompt: string,
    config: Record<string, any>,
  ): string {
    const skills: { name: string }[] = config._skills ?? [];
    const references: { name: string }[] = config._references ?? [];

    let transformed = `# TaskClaw Context\n\n${prompt}`;

    for (const skill of skills) {
      transformed += `\n\n## Skill: ${skill.name}`;
    }

    for (const ref of references) {
      transformed += `\n\n## Reference: ${ref.name}`;
    }

    return transformed;
  }

  async sendMessage(options: BackboneSendOptions): Promise<BackboneSendResult> {
    const { config, systemPrompt, message, history = [], onToken, signal } =
      options;

    const model = config.model ?? 'claude-sonnet-4-20250514';
    const maxTokens = config.max_tokens ?? 4096;
    const streaming = typeof onToken === 'function';

    const messages = [
      ...history
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const body: Record<string, any> = {
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
      stream: streaming,
    };

    const url = `${config.api_url.replace(/\/+$/, '')}/v1/messages`;

    this.logger.debug(`POST ${url} (model=${model}, stream=${streaming})`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.api_key,
        'anthropic-version': config.anthropic_version ?? '2023-06-01',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      throw new Error(
        `claude-code: API returned ${response.status} — ${errorText}`,
      );
    }

    if (streaming) {
      return this.handleStream(response, onToken!);
    }

    const json = await response.json();
    const text =
      json.content
        ?.filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('') ?? '';

    return {
      text,
      usage: json.usage
        ? {
            prompt_tokens: json.usage.input_tokens,
            completion_tokens: json.usage.output_tokens,
            total_tokens:
              (json.usage.input_tokens ?? 0) +
              (json.usage.output_tokens ?? 0),
          }
        : undefined,
      model: json.model,
      raw: json,
    };
  }

  async healthCheck(config: Record<string, any>): Promise<BackboneHealthResult> {
    const start = Date.now();
    try {
      const url = `${config.api_url.replace(/\/+$/, '')}/v1/models`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': config.api_key,
          'anthropic-version': config.anthropic_version ?? '2023-06-01',
        },
        signal: AbortSignal.timeout(10_000),
      });

      return {
        healthy: response.ok,
        latencyMs: Date.now() - start,
        error: response.ok
          ? undefined
          : `HTTP ${response.status}`,
      };
    } catch (err: any) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err.message ?? String(err),
      };
    }
  }

  // ── Private helpers ──────────────────────────────────────────────

  private async handleStream(
    response: Response,
    onToken: (token: string) => void,
  ): Promise<BackboneSendResult> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let usage: BackboneSendResult['usage'];
    let model: string | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!; // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);

            if (event.type === 'content_block_delta') {
              const text = event.delta?.text ?? '';
              if (text) {
                fullText += text;
                onToken(text);
              }
            }

            if (event.type === 'message_start') {
              model = event.message?.model;
            }

            if (event.type === 'message_delta' && event.usage) {
              usage = {
                prompt_tokens: event.usage.input_tokens,
                completion_tokens: event.usage.output_tokens,
                total_tokens:
                  (event.usage.input_tokens ?? 0) +
                  (event.usage.output_tokens ?? 0),
              };
            }
          } catch {
            // non-JSON line, skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return { text: fullText, usage, model };
  }
}

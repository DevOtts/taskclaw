import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { withRetry } from '../common/utils/retry.util';
import { LangfuseService } from '../ee/langfuse/langfuse.service';

export interface OpenClawMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenClawRequest {
  agent_id?: string;
  messages: OpenClawMessage[];
  stream?: boolean;
}

export interface OpenClawResponse {
  response: string;
  metadata?: {
    tokens_used?: number;
    model?: string;
    [key: string]: any;
  };
}

export interface OpenClawConfig {
  api_url: string;
  api_key: string;
  agent_id?: string;
}

@Injectable()
export class OpenClawService {
  private readonly logger = new Logger(OpenClawService.name);

  constructor(private readonly langfuse: LangfuseService) {}

  /**
   * Send a chat request to OpenClaw/OpenRouter instance with retry logic.
   * Retries up to 3 times on network errors and 5xx status codes
   * with exponential backoff (1s, 3s, 9s).
   *
   * All calls are traced via Langfuse for token/cost monitoring.
   */
  async sendMessage(
    config: OpenClawConfig,
    messages: OpenClawMessage[],
    traceContext?: {
      userId?: string;
      accountId?: string;
      conversationId?: string;
    },
  ): Promise<OpenClawResponse> {
    const startTime = Date.now();
    let result: OpenClawResponse | undefined;
    let error: Error | undefined;

    try {
      result = await withRetry(
        () => this.executeAIRequest(config, messages),
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          backoffMultiplier: 3,
          logger: this.logger,
          operationName: 'AI sendMessage',
        },
      );
      return result;
    } catch (err) {
      error = err;
      this.logger.error('AI API error after retries:', err.message);

      if (err.name === 'AbortError') {
        throw new BadRequestException(
          'AI request timed out after 30 seconds',
        );
      }

      throw new BadRequestException(
        `Failed to communicate with AI: ${err.message}`,
      );
    } finally {
      // Always trace the call (success or failure)
      const durationMs = Date.now() - startTime;
      this.langfuse.traceGeneration({
        name: 'chat-message',
        model: result?.metadata?.model || 'unknown',
        input: messages,
        output: result?.response || null,
        usage: result?.metadata?.tokens_used
          ? {
              totalTokens: result.metadata.tokens_used,
              // Estimate split: ~30% prompt, ~70% completion
              promptTokens: Math.round(result.metadata.tokens_used * 0.3),
              completionTokens: Math.round(result.metadata.tokens_used * 0.7),
            }
          : undefined,
        durationMs,
        userId: traceContext?.userId,
        accountId: traceContext?.accountId,
        conversationId: traceContext?.conversationId,
        tags: [
          config.api_url.includes('openrouter.ai') ? 'openrouter' : 'openclaw',
        ],
        success: !error,
        error: error?.message,
      });
    }
  }

  /**
   * Execute a single AI API request (without retry — called by sendMessage via withRetry).
   */
  private async executeAIRequest(
    config: OpenClawConfig,
    messages: OpenClawMessage[],
  ): Promise<OpenClawResponse> {
    // Detect if this is OpenRouter based on URL
    const isOpenRouter = config.api_url.includes('openrouter.ai');

    let requestBody: any;
    let endpoint: string;

    if (isOpenRouter) {
      // OpenRouter format
      requestBody = {
        model: 'openai/gpt-3.5-turbo', // Default model
        messages: messages,
      };
      endpoint = `${config.api_url}/chat/completions`;

      this.logger.log(
        `Sending ${messages.length} messages to OpenRouter`,
      );
    } else {
      // OpenClaw format — uses OpenResponses API (/v1/responses)
      const input = messages.map((m) => ({
        type: 'message' as const,
        role: m.role,
        content: m.content,
      }));

      requestBody = {
        model: 'openclaw',
        input,
        stream: false,
      };

      if (config.agent_id) {
        requestBody.agent_id = config.agent_id;
      }

      endpoint = `${config.api_url}/v1/responses`;

      this.logger.log(
        `Sending ${messages.length} messages to OpenClaw at ${config.api_url}`,
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.api_key}`,
    };

    if (!isOpenRouter && config.agent_id) {
      headers['x-openclaw-agent-id'] = config.agent_id;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(120000), // 120 second timeout for OpenClaw
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API error (${response.status}): ${errorText}`,
      );
    }

    const data = await response.json();

    // Handle OpenRouter response format
    if (isOpenRouter && data.choices && data.choices[0]) {
      return {
        response: data.choices[0].message.content,
        metadata: {
          model: data.model,
          tokens_used: data.usage?.total_tokens,
        },
      };
    }

    // Handle OpenClaw/OpenResponses response format
    // Format: { output: [{ type: "message", content: [{ type: "output_text", text: "..." }] }] }
    if (data.output && Array.isArray(data.output)) {
      const textItems = data.output.filter(
        (item: { type: string }) => item.type === 'message',
      );
      if (textItems.length > 0) {
        const lastMessage = textItems[textItems.length - 1];
        if (lastMessage.content) {
          if (typeof lastMessage.content === 'string') {
            return { response: lastMessage.content, metadata: { model: data.model } };
          }
          if (Array.isArray(lastMessage.content)) {
            const text = lastMessage.content
              .filter((c: { type: string }) => c.type === 'output_text')
              .map((c: { text: string }) => c.text)
              .join('');
            if (text) {
              return { response: text, metadata: { model: data.model } };
            }
          }
        }
      }
    }

    if (data.output_text) {
      return { response: data.output_text, metadata: { model: data.model } };
    }

    // Handle simple response formats
    if (typeof data === 'string') {
      return { response: data };
    }

    if (data.response) {
      return data;
    }

    if (data.message) {
      return { response: data.message, metadata: data };
    }

    if (data.content) {
      return { response: data.content, metadata: data };
    }

    this.logger.warn('Unexpected OpenClaw response shape', JSON.stringify(data).slice(0, 500));
    throw new Error('Unexpected response format from AI provider');
  }

  /**
   * Test connection to OpenClaw/OpenRouter instance
   */
  async testConnection(config: OpenClawConfig): Promise<boolean> {
    try {
      const isOpenRouter = config.api_url.includes('openrouter.ai');
      
      if (isOpenRouter) {
        // OpenRouter doesn't have a /health endpoint, test with models list
        const response = await fetch(`${config.api_url}/models`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${config.api_key}`,
          },
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      } else {
        // OpenClaw health endpoint
        const response = await fetch(`${config.api_url}/health`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${config.api_key}`,
          },
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      }
    } catch (error) {
      this.logger.error('AI connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Build conversation history for OpenClaw
   */
  buildMessageHistory(
    systemPrompt: string,
    conversationHistory: Array<{ role: string; content: string }>,
    userMessage: string,
  ): OpenClawMessage[] {
    const messages: OpenClawMessage[] = [];

    // Add system prompt
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add conversation history (limit to last N messages to avoid token limits)
    const recentHistory = conversationHistory.slice(-10); // Last 10 messages
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    return messages;
  }
}

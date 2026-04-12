import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { spawn, execSync } from 'child_process';
import * as fs from 'fs';
import type {
  BackboneAdapter,
  BackboneSendOptions,
  BackboneSendResult,
  BackboneHealthResult,
  ToolCallRequest,
} from './backbone-adapter.interface';

/**
 * ClaudeCodeAdapter (F202, F203, F204, F206)
 *
 * Local subprocess adapter for the Claude Code CLI.
 * Uses `claude --print --output-format json` — NOT an HTTP API.
 * The `claude` binary must be installed and available in PATH.
 *
 * Protocol: cli
 * Config fields (all optional):
 *   - model            — Claude model slug (default: claude-sonnet-4-6)
 *   - workspace_path   — Working directory for the subprocess
 *   - system_prompt_prefix — Prefix prepended to all system prompts
 *   - timeout_seconds  — Max seconds to wait for response (default: 120)
 */
@Injectable()
export class ClaudeCodeAdapter implements BackboneAdapter {
  readonly slug = 'claude-code';
  private readonly logger = new Logger(ClaudeCodeAdapter.name);

  // ── sendMessage (F202, F206) ──────────────────────────────────────

  async sendMessage(options: BackboneSendOptions): Promise<BackboneSendResult> {
    const { config, systemPrompt, message, history = [], onToken, signal } =
      options;

    const timeoutMs = (config.timeout_seconds ?? 120) * 1000;
    const model = config.model || 'claude-sonnet-4-6';
    const workspaceDir = config.workspace_path || process.cwd();

    // Build tool instructions to inject into system prompt (before conversation)
    const toolInstructions = options.tool_context?.length
      ? this.buildToolInstructions(options.tool_context)
      : '';

    // Build full conversation prompt for --print mode
    const fullPrompt = this.buildPrompt(
      toolInstructions ? systemPrompt + '\n\n' + toolInstructions : systemPrompt,
      history,
      message,
      config,
    );

    this.logger.debug(
      `Claude Code CLI: spawning claude --print (model=${model})`,
    );

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 5000;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      // Don't retry if the request was aborted
      if (signal?.aborted) throw new Error('Request aborted');

      try {
        const result = await this.spawnClaude({
          fullPrompt,
          model,
          workspaceDir,
          timeoutMs,
          options,
          signal,
        });
        return result;
      } catch (err: any) {
        // Don't retry if claude is not installed or request was aborted
        if (err.code === 'ENOENT' || err.message?.includes('not found in PATH') || err.message === 'Request aborted') {
          throw err;
        }
        lastError = err;
        if (attempt < MAX_RETRIES) {
          this.logger.warn(
            `Claude Code CLI attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}. Retrying in ${RETRY_DELAY_MS / 1000}s...`,
          );
          await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
        }
      }
    }

    throw lastError ?? new Error('Claude Code CLI failed after retries');
  }

  // ── spawnClaude (internal single attempt) ─────────────────────
  private spawnClaude({
    fullPrompt,
    model,
    workspaceDir,
    timeoutMs,
    options,
    signal,
  }: {
    fullPrompt: string;
    model: string;
    workspaceDir: string;
    timeoutMs: number;
    options: BackboneSendOptions;
    signal?: AbortSignal;
  }): Promise<BackboneSendResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const args = [
        '--print',
        '--output-format',
        'json',
        '--model',
        model,
        '--dangerously-skip-permissions',
        fullPrompt,
      ];

      let stdout = '';
      let stderr = '';

      // Strip CLAUDECODE to allow nested invocation from within Claude Code sessions
      const childEnv = { ...process.env };
      delete childEnv['CLAUDECODE'];

      const child = spawn('claude', args, {
        cwd: workspaceDir,
        env: childEnv,
        timeout: timeoutMs,
        // Close stdin so --print mode doesn't block waiting for interactive input
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
        // Forward raw chunks when caller wants streaming tokens
        if (options.onToken) {
          options.onToken(data.toString());
        }
      });

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const latencyMs = Date.now() - startTime;
        this.logger.debug(
          `Claude Code CLI: exit code ${code} in ${latencyMs}ms`,
        );

        if (code !== 0) {
          reject(
            new Error(
              `claude CLI exited with code ${code}: ${stderr || stdout}`,
            ),
          );
          return;
        }

        // Parse JSON output from --output-format json
        try {
          const rawText = this.parseClaudeOutput(stdout);
          // Extract text-based tool calls if tool context was provided
          if (options.tool_context?.length) {
            const { cleanText, toolCalls } = this.parseTextBasedToolCalls(rawText);
            if (toolCalls.length > 0) {
              resolve({ text: cleanText, model, tool_calls: toolCalls, usage: { total_tokens: Math.ceil(rawText.length / 4) } });
              return;
            }
          }
          resolve({
            text: rawText,
            model,
            usage: { total_tokens: Math.ceil(rawText.length / 4) },
          });
        } catch {
          // Fallback: return raw stdout if JSON parse fails
          resolve({ text: stdout.trim(), model });
        }
      });

      child.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
          reject(
            new Error(
              'claude CLI not found in PATH. Install Claude Code: https://claude.ai/code',
            ),
          );
        } else {
          reject(err);
        }
      });

      // Honour AbortSignal for cancellation (F206)
      if (signal) {
        signal.addEventListener('abort', () => {
          child.kill('SIGTERM');
          reject(new Error('Request aborted'));
        });
      }
    });
  }

  // ── healthCheck (F203) ───────────────────────────────────────────

  async healthCheck(
    _config: Record<string, any>,
  ): Promise<BackboneHealthResult> {
    const start = Date.now();
    try {
      const output = execSync('claude --version', {
        timeout: 5000,
        encoding: 'utf8',
      });
      const version = output.trim();
      return {
        healthy: true,
        latencyMs: Date.now() - start,
        metadata: { version, type: 'local-cli' },
      };
    } catch (err: any) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error:
          err.code === 'ENOENT'
            ? 'claude CLI not found in PATH. Install Claude Code.'
            : `claude --version failed: ${err.message}`,
      };
    }
  }

  // ── validateConfig (F204) ─────────────────────────────────────────

  validateConfig(config: Record<string, any>): void {
    // All fields are optional for the local CLI adapter
    if (config.workspace_path && !fs.existsSync(config.workspace_path)) {
      throw new BadRequestException(
        `workspace_path does not exist: ${config.workspace_path}`,
      );
    }
    if (config.timeout_seconds !== undefined) {
      const t = Number(config.timeout_seconds);
      if (isNaN(t) || t < 5 || t > 600) {
        throw new BadRequestException(
          'timeout_seconds must be between 5 and 600',
        );
      }
    }
  }

  // ── transformSystemPrompt ─────────────────────────────────────────

  transformSystemPrompt(prompt: string, _config: Record<string, any>): string {
    // Format as CLAUDE.md-style instructions for the subprocess
    return `# TaskClaw Agent Instructions\n\n${prompt}`;
  }

  // ── supportsNativeSkillInjection ──────────────────────────────────

  supportsNativeSkillInjection(): boolean {
    return false;
  }

  // ── supportsTextBasedToolCalling ──────────────────────────────────

  supportsTextBasedToolCalling(): boolean {
    return true;
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * Build tool instructions to be injected into the system prompt for text-based tool calling.
   */
  private buildToolInstructions(toolContext: BackboneSendOptions['tool_context']): string {
    if (!toolContext?.length) return '';
    const toolList = toolContext
      .map((t) => {
        const required = (t.input_schema as any)?.required ?? [];
        const props = (t.input_schema as any)?.properties ?? {};
        const args = Object.entries(props)
          .map(([k, v]: [string, any]) => `  - ${k}${required.includes(k) ? ' (required)' : ' (optional)'}: ${v.description || v.type}`)
          .join('\n');
        return `**${t.name}**: ${t.description}\n${args}`;
      })
      .join('\n\n');
    return `=== TASKCLAW ACTION TOOLS ===
You have access to TaskClaw tools. When the user asks you to CREATE, ADD, or MODIFY something (goals, tasks, etc.), you MUST call the appropriate tool — do NOT just describe what you would do.

To call a tool, output this XML format on its own line:
<tool_call name="TOOL_NAME">{"arg1": "value1", "arg2": "value2"}</tool_call>

EXAMPLE — if asked to create a goal "Grow revenue":
<tool_call name="decompose_goal">{"goal": "Grow revenue"}</tool_call>

Available tools:
${toolList}

RULES:
- When asked to create/update something: OUTPUT the <tool_call> XML FIRST, then briefly describe what you did
- Do NOT say "I'll create..." or "I would create..." — actually output the tool call
- The system will execute your tool call and show results
- You can chain multiple tool calls on separate lines`;
  }

  /**
   * Parse text-based tool calls from response text.
   * Extracts <tool_call name="...">{ args }</tool_call> blocks.
   */
  private parseTextBasedToolCalls(text: string): { cleanText: string; toolCalls: ToolCallRequest[] } {
    const toolCallRegex = /<tool_call\s+name="([^"]+)">([\s\S]*?)<\/tool_call>/g;
    const toolCalls: ToolCallRequest[] = [];
    let match;
    let id = 0;
    while ((match = toolCallRegex.exec(text)) !== null) {
      const name = match[1];
      const argsStr = match[2].trim();
      try {
        const input = JSON.parse(argsStr);
        toolCalls.push({ id: `claude-code-tool-${++id}`, name, input });
      } catch {
        // skip malformed tool call
      }
    }
    const cleanText = text.replace(toolCallRegex, '').trim();
    return { cleanText, toolCalls };
  }

  /**
   * Build a single prompt string from system prompt, history, and the
   * current user message.  Passed as the positional argument to
   * `claude --print`.  (F206)
   */
  private buildPrompt(
    systemPrompt: string,
    history: Array<{ role: string; content: string }>,
    message: string,
    config: Record<string, any>,
  ): string {
    const parts: string[] = [];

    const prefix = config.system_prompt_prefix as string | undefined;
    if (prefix) {
      parts.push(prefix);
    }

    if (systemPrompt) {
      parts.push(systemPrompt);
    }

    if (history.length > 0) {
      const historyText = history
        .map((h) => {
          if (h.role === 'user') return `User: ${h.content}`;
          if (h.role === 'tool') {
            // Tool results — show as system feedback so the model knows the action succeeded
            return `Tool Result: ${h.content}`;
          }
          return `Assistant: ${h.content}`;
        })
        .join('\n\n');
      parts.push(`Previous conversation:\n${historyText}`);
    }

    parts.push(`User: ${message}`);
    parts.push('Assistant:');

    return parts.join('\n\n');
  }

  /**
   * Parse `--output-format json` output.
   *
   * Claude CLI emits one JSON object per line; the final result line has
   * `{ "type": "result", "subtype": "success", "result": "<text>" }`.
   * We scan from the end to find it.
   */
  private parseClaudeOutput(stdout: string): string {
    const lines = stdout.trim().split('\n').filter(Boolean);

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]);
        if (parsed.type === 'result' && parsed.result) {
          return parsed.result as string;
        }
        if (parsed.result) {
          return parsed.result as string;
        }
      } catch {
        // Not JSON — continue scanning upward
      }
    }

    // Fallback: concatenate any non-JSON lines
    const textLines = lines.filter((line) => {
      try {
        JSON.parse(line);
        return false;
      } catch {
        return true;
      }
    });
    return textLines.join('\n').trim() || stdout.trim();
  }
}

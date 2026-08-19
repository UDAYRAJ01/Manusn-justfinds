import { invokeLLM, type Message, type OutputSchema } from "../../_core/llm";
import { ENV } from "../../_core/env";

export type AiProviderName = "builtin-forge";

export type AiGenerationRequest = {
  system: string;
  user: string;
  outputSchema?: OutputSchema;
  model?: string;
  maxTokens?: number;
};

export type AiGenerationResult<T> = {
  data: T;
  provider: AiProviderName;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export class AiProviderUnavailableError extends Error {
  constructor(message = "AI generation is unavailable because no server provider is configured.") {
    super(message);
    this.name = "AiProviderUnavailableError";
  }
}

export class AiProviderResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderResponseError";
  }
}

// `gpt-5-mini` remains the verified general structured-output default. Imported
// listings opt into the managed Gemini pair below so the normal editor path does
// not change unexpectedly.
const DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL?.trim() || "gpt-5-mini";
export const IMPORT_REWRITE_FIRST_PASS_MODEL = "gemini-3-flash-preview";
export const IMPORT_REWRITE_QUALITY_MODEL = "gemini-3.1-pro-preview";

function getTextContent(content: Message["content"]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part): part is { type: "text"; text: string } => typeof part !== "string" && part.type === "text")
      .map(part => part.text)
      .join("\n");
  }
  return typeof content === "object" && content.type === "text" ? content.text : "";
}

export function isAiProviderConfigured(): boolean {
  return Boolean(ENV.forgeApiUrl.trim() && ENV.forgeApiKey.trim());
}

export async function generateStructured<T>(request: AiGenerationRequest): Promise<AiGenerationResult<T>> {
  if (!isAiProviderConfigured()) throw new AiProviderUnavailableError();

  const response = await invokeLLM({
    model: request.model || DEFAULT_MODEL,
    messages: [
      { role: "system", content: request.system },
      { role: "user", content: request.user },
    ],
    outputSchema: request.outputSchema,
    responseFormat: request.outputSchema ? undefined : { type: "json_object" },
    maxTokens: request.maxTokens ?? 1800,
  });
  const content = getTextContent(response.choices[0]?.message?.content ?? "");
  if (!content) throw new AiProviderResponseError("The AI provider returned an empty response.");

  let data: T;
  try {
    data = JSON.parse(content) as T;
  } catch {
    throw new AiProviderResponseError("The AI provider returned invalid structured content.");
  }

  return {
    data,
    provider: "builtin-forge",
    model: response.model || request.model || DEFAULT_MODEL || "managed-default",
    promptTokens: response.usage?.prompt_tokens,
    completionTokens: response.usage?.completion_tokens,
    totalTokens: response.usage?.total_tokens,
  };
}

export function classifyAiError(error: unknown): "provider_unavailable" | "provider_response" | "unknown" {
  if (error instanceof AiProviderUnavailableError) return "provider_unavailable";
  if (error instanceof AiProviderResponseError) return "provider_response";
  return "unknown";
}

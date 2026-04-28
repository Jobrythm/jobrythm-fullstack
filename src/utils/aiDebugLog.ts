// In-memory ring buffer of recent AI calls for admin debugging.
// Lives only in the running process — not persisted. Capped to MAX_ENTRIES
// to keep memory use bounded.

export type AiLogStatus = 'success' | 'error' | 'unconfigured';

export interface AiDebugLogEntry {
  id: string;
  timestamp: string;        // ISO
  endpoint: string;         // e.g. 'POST /api/jobs/:id/ai-suggest-line-items'
  status: AiLogStatus;
  durationMs: number;
  userId?: string;
  userEmail?: string;
  model?: string;
  request?: {
    systemPrompt?: string;
    userPrompt?: string;
    body?: unknown;
    params?: Record<string, string>;
  };
  rawResponse?: string;
  parsedResponse?: unknown;
  error?: {
    message: string;
    name?: string;
    stack?: string;
    detail?: unknown;
  };
  notes?: string[];
}

const MAX_ENTRIES = 100;
const buffer: AiDebugLogEntry[] = [];

let counter = 0;
function nextId(): string {
  counter += 1;
  return `${Date.now()}-${counter}`;
}

export function recordAiLog(entry: Omit<AiDebugLogEntry, 'id' | 'timestamp'>): AiDebugLogEntry {
  const full: AiDebugLogEntry = {
    id: nextId(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  buffer.unshift(full);
  if (buffer.length > MAX_ENTRIES) buffer.length = MAX_ENTRIES;
  return full;
}

export function getAiLogs(): AiDebugLogEntry[] {
  // Return a shallow copy so callers can't mutate the buffer.
  return buffer.slice();
}

export function clearAiLogs(): void {
  buffer.length = 0;
}

/**
 * Helper to safely serialize an error (including non-Error throwables) into
 * the structured shape stored in the log.
 */
export function serializeError(err: unknown): AiDebugLogEntry['error'] {
  if (err instanceof Error) {
    // Some SDK errors attach extra fields (status, response body) that are
    // hugely useful for debugging — capture anything enumerable.
    const extra: Record<string, unknown> = {};
    for (const key of Object.keys(err) as Array<keyof Error & string>) {
      try {
        extra[key] = (err as unknown as Record<string, unknown>)[key];
      } catch {
        // ignore non-cloneable props
      }
    }
    return {
      message: err.message,
      name: err.name,
      stack: err.stack,
      detail: Object.keys(extra).length > 0 ? extra : undefined,
    };
  }
  return { message: typeof err === 'string' ? err : JSON.stringify(err) };
}

export interface JsonValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

/** Parses `raw` and, on failure, walks it to report a human line/column instead of just re-throwing V8's message. */
export const validateJson = (raw: string): JsonValidationResult => {
  if (raw.trim() === '') return { valid: true };
  try {
    JSON.parse(raw);
    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    const positionMatch = message.match(/position (\d+)/);
    if (!positionMatch) return { valid: false, error: message };

    const position = Number(positionMatch[1]);
    const upToError = raw.slice(0, position);
    const line = upToError.split('\n').length;
    const column = position - upToError.lastIndexOf('\n');
    return { valid: false, error: message, line, column };
  }
};

export const formatJson = (raw: string): string => JSON.stringify(JSON.parse(raw), null, 2);

export const minifyJson = (raw: string): string => JSON.stringify(JSON.parse(raw));

export const tryParseJson = (raw: string): { ok: true; value: unknown } | { ok: false } => {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
};

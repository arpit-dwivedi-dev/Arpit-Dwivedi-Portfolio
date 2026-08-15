import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const valueClass = (value: JsonValue): string => {
  if (value === null) return 'text-secondary-text';
  switch (typeof value) {
    case 'string':
      return 'text-emerald-400';
    case 'number':
      return 'text-accent-blue';
    case 'boolean':
      return 'text-accent-purple-text';
    default:
      return 'text-ink';
  }
};

const formatPrimitive = (value: JsonValue): string => {
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
};

interface JsonNodeProps {
  value: JsonValue;
  depth: number;
}

const JsonNode = ({ value, depth }: JsonNodeProps) => {
  const isArray = Array.isArray(value);
  const isObject = !isArray && value !== null && typeof value === 'object';
  // First two levels open by default so a typical API response isn't a wall
  // of collapsed brackets on load; deeper nesting starts collapsed.
  const [expanded, setExpanded] = useState(depth < 2);

  if (!isArray && !isObject) {
    return <span className={valueClass(value)}>{formatPrimitive(value)}</span>;
  }

  const entries: Array<[string, JsonValue]> = isArray
    ? (value as JsonValue[]).map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, JsonValue>);

  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  if (entries.length === 0) {
    return (
      <span className="text-secondary-text">
        {openBracket}
        {closeBracket}
      </span>
    );
  }

  return (
    <span>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse' : 'Expand'}
        className="inline-flex items-center align-middle text-secondary-text hover:text-ink transition-colors"
      >
        <ChevronRight size={12} aria-hidden="true" className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      <span className="text-secondary-text">{openBracket}</span>
      {!expanded && <span className="text-secondary-text/60 mx-1">{entries.length} items</span>}
      {expanded && (
        <div className="pl-4 border-l border-ink/10 ml-1.5">
          {entries.map(([key, child], idx) => (
            <div key={key}>
              {isObject && <span className="text-secondary-text">"{key}"</span>}
              {isObject && <span className="text-secondary-text">: </span>}
              <JsonNode value={child} depth={depth + 1} />
              {idx < entries.length - 1 && <span className="text-secondary-text">,</span>}
            </div>
          ))}
        </div>
      )}
      <span className="text-secondary-text">{closeBracket}</span>
    </span>
  );
};

interface JsonTreeViewProps {
  data: JsonValue;
}

// whitespace-pre (no wrap) rather than pre-wrap/break-all: long unbroken values like
// URL paths stay intact and scroll horizontally with the panel instead of splitting
// mid-word, matching how VS Code and browser devtools render long JSON lines.
export const JsonTreeView = ({ data }: JsonTreeViewProps) => (
  <div className="font-mono text-[13px] leading-relaxed whitespace-pre">
    <JsonNode value={data} depth={0} />
  </div>
);

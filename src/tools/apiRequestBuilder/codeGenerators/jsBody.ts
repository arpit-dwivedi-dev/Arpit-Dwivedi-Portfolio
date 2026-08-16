import type { GeneratorBody } from './generatorInput';

export interface JsBodyResult {
  /** Statements to place before the fetch/axios call, e.g. `const params = new URLSearchParams();`. */
  decl: string[];
  /** Expression for `body:`/`data:` — undefined when the request has no body. */
  expr?: string;
  /** Anything that couldn't be faithfully represented, surfaced as generated-code comments. */
  notes: string[];
}

/** Shared JSON/text/form/multipart body construction for Fetch, Node, and Axios. `jsonAsObject`
 *  is the one axis where they genuinely differ: fetch/node bodies must be a string (so a JSON body
 *  is `JSON.stringify({...})`), while Axios serializes a plain object itself (so passing the object
 *  literal directly, unwrapped, is the idiomatic Axios form). */
export const buildJsBody = (body: GeneratorBody, jsonAsObject: boolean): JsBodyResult => {
  switch (body.mode) {
    case 'none':
      return { decl: [], notes: [] };

    case 'json': {
      if (body.raw.trim() === '') return { decl: [], expr: `''`, notes: [] };
      if (body.parsed.ok) {
        const literal = JSON.stringify(body.parsed.value, null, 2);
        return { decl: [], expr: jsonAsObject ? literal : `JSON.stringify(${literal})`, notes: [] };
      }
      return {
        decl: [],
        expr: JSON.stringify(body.raw),
        notes: ["Body content isn't valid JSON — sent as a raw string instead."],
      };
    }

    case 'text':
      return { decl: [], expr: JSON.stringify(body.raw), notes: [] };

    case 'form-urlencoded': {
      const decl = ['const params = new URLSearchParams();'];
      for (const field of body.fields) {
        decl.push(`params.append(${JSON.stringify(field.key)}, ${JSON.stringify(field.value)});`);
      }
      return { decl, expr: 'params.toString()', notes: [] };
    }

    case 'multipart': {
      const decl = ['const formData = new FormData();'];
      const notes: string[] = [];
      for (const field of body.fields) {
        if (field.isFile) {
          const label = field.fileName ?? field.value ?? field.key;
          notes.push(`File field ${JSON.stringify(field.key)} (${label}) must be supplied locally — a File/Blob can't be reconstructed in generated code.`);
          decl.push(`// formData.append(${JSON.stringify(field.key)}, /* your File or Blob object for "${label}" */);`);
        } else {
          decl.push(`formData.append(${JSON.stringify(field.key)}, ${JSON.stringify(field.value)});`);
        }
      }
      return { decl, expr: 'formData', notes };
    }

    default:
      return { decl: [], notes: [] };
  }
};

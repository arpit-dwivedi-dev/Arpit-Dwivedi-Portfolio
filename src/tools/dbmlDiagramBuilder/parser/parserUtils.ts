export function slugify(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'unnamed';
}

/** Appends a numeric suffix if `id` already exists in `used`, and records the final id. */
export function uniqueId(id: string, used: Set<string>): string {
  if (!used.has(id)) {
    used.add(id);
    return id;
  }
  let n = 2;
  while (used.has(`${id}_${n}`)) n++;
  const finalId = `${id}_${n}`;
  used.add(finalId);
  return finalId;
}

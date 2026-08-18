import fs from 'fs';
import path from 'path';
import { parseDbml } from '../parser/dbmlParser';
import { buildNodes } from '../diagram/buildNodes';
import { buildEdges } from '../diagram/buildEdges';
import { buildGroupNodes } from '../diagram/buildGroupNodes';
import { layoutSchema, resolvePositions } from '../diagram/layout';
import { buildSchemaSearchIndex, searchSchema } from '../search/schemaSearch';
import { detectCompletionContext, getDbmlCompletions } from '../monaco/completions';

const FIXTURE_PATH = path.join(__dirname, 'large.dbml');

function time(label: string, fn: () => void): number {
  const start = performance.now();
  fn();
  const ms = performance.now() - start;
  // eslint-disable-next-line no-console
  console.log(`[bench] ${label}: ${ms.toFixed(2)}ms`);
  return ms;
}

describe('large-schema performance (100+ tables, 1000+ columns, 200+ relationships)', () => {
  const dbml = fs.readFileSync(FIXTURE_PATH, 'utf-8');

  it('parses, lays out and builds the diagram within a sane budget', () => {
    let schema = parseDbml(dbml);
    expect(schema.warnings.filter((w) => w.severity === 'error')).toHaveLength(0);
    expect(schema.tables.length).toBeGreaterThanOrEqual(100);
    const totalColumns = schema.tables.reduce((n, t) => n + t.columns.length, 0);
    expect(totalColumns).toBeGreaterThanOrEqual(1000);
    expect(schema.relationships.length).toBeGreaterThanOrEqual(200);

    const parseMs = time('parseDbml (cold)', () => {
      schema = parseDbml(dbml);
    });

    const positions = layoutSchema(schema);
    const layoutMs = time('layoutSchema', () => {
      layoutSchema(schema);
    });

    const buildMs = time('buildNodes+buildEdges+buildGroupNodes', () => {
      buildNodes(schema, positions);
      buildEdges(schema, positions);
      buildGroupNodes(schema, positions);
    });

    const resolveMs = time('resolvePositions (incremental, no changes)', () => {
      resolvePositions(schema, positions);
    });

    const searchIndex = buildSchemaSearchIndex(schema);
    const searchMs = time('searchSchema (single query over full index)', () => {
      searchSchema(searchIndex, 'field_3');
    });

    const reparseMs = time('re-parse on a single-char edit (simulated keystroke)', () => {
      parseDbml(dbml.replace('field_0 varchar', 'field_0x varchar'));
    });

    const offset = dbml.indexOf('Ref: public.table_0') + 'Ref: '.length;
    const completionMs = time('detectCompletionContext + getDbmlCompletions at a Ref position', () => {
      const ctx = detectCompletionContext(dbml, offset, schema);
      getDbmlCompletions(dbml, offset, schema);
      expect(ctx.kind).toBe('table-ref');
    });

    // Generous budgets — this is a correctness-oriented regression guard
    // against an accidental O(n^2)/full-rescan reintroduction, not a strict
    // perf SLA. Most of these land well under 100ms on the dev machine;
    // `layoutMs` alone runs dagre over this fixture's deliberately dense,
    // highly cyclic relationship graph (see genLargeDbml.js), which measured
    // 700-1150ms across repeated runs — hence the wider margin below, sized
    // to still catch an accidental algorithmic blowup (e.g. O(n^3)) without
    // flaking on ordinary machine-load jitter.
    expect(parseMs).toBeLessThan(1000);
    expect(layoutMs).toBeLessThan(3000);
    expect(buildMs).toBeLessThan(1000);
    expect(resolveMs).toBeLessThan(1000);
    expect(searchMs).toBeLessThan(200);
    expect(reparseMs).toBeLessThan(1000);
    expect(completionMs).toBeLessThan(200);
  });
});

describe('large-schema incremental edit (add one table to an already-positioned diagram)', () => {
  const dbml = fs.readFileSync(FIXTURE_PATH, 'utf-8');

  it('does not pay a full dagre relayout when only one new table is missing a position', () => {
    const schema = parseDbml(dbml);
    const fullLayout = layoutSchema(schema);
    const withOneNewTable = parseDbml(`${dbml}\nTable public.brand_new_table {\n  id integer [pk]\n}\n`);

    const ms = time('resolvePositions after adding 1 table to a 120-table diagram', () => {
      resolvePositions(withOneNewTable, fullLayout);
    });

    expect(ms).toBeLessThan(100);
  });
});

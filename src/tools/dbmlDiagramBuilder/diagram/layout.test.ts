import { parseDbml } from '../parser/dbmlParser';
import { layoutSchema, resolvePositions } from './layout';

describe('layoutSchema — schema-qualified identity', () => {
  it('gives same-named tables in different schemas independent, non-colliding positions', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Table auth.users { id integer [pk] }
    `);
    const positions = layoutSchema(schema);
    expect(Object.keys(positions).sort()).toEqual(['auth.users', 'public.users']);
    expect(positions['public.users']).not.toEqual(positions['auth.users']);
  });

  it('keys an unqualified table by its bare lowercased name, unchanged from before schema support', () => {
    const schema = parseDbml(`Table Users { id integer [pk] }`);
    const positions = layoutSchema(schema);
    expect(Object.keys(positions)).toEqual(['users']);
  });
});

describe('resolvePositions — manual position persistence', () => {
  it('keeps public.users and auth.users positions independent across reloads', () => {
    const schema = parseDbml(`
      Table public.users { id integer [pk] }
      Table auth.users { id integer [pk] }
    `);
    const stored = { 'public.users': { x: 10, y: 20 }, 'auth.users': { x: 300, y: 400 } };
    const resolved = resolvePositions(schema, stored);
    expect(resolved['public.users']).toEqual({ x: 10, y: 20 });
    expect(resolved['auth.users']).toEqual({ x: 300, y: 400 });
  });

  it('falls back to a legacy exact-case-name position key for an unqualified table', () => {
    const schema = parseDbml(`Table Users { id integer [pk] }`);
    // Positions saved before schema support existed were keyed by the table's
    // exact-case display name, not the lowercased canonical key.
    const stored = { Users: { x: 42, y: 7 } };
    const resolved = resolvePositions(schema, stored);
    expect(resolved.users).toEqual({ x: 42, y: 7 });
  });

  it('does not apply the legacy fallback to a schema-qualified table', () => {
    const schema = parseDbml(`Table public.users { id integer [pk] }`);
    // A stray "users" key (e.g. from an unrelated unqualified table) must
    // never be picked up as this qualified table's legacy position.
    const stored = { users: { x: 99, y: 99 } };
    const resolved = resolvePositions(schema, stored);
    expect(resolved['public.users']).not.toEqual({ x: 99, y: 99 });
  });

  it('only relayouts tables missing a stored position, preserving the rest', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table posts { id integer [pk] user_id integer }
      Ref: posts.user_id > users.id
    `);
    const stored = { users: { x: 5, y: 5 } };
    const resolved = resolvePositions(schema, stored);
    expect(resolved.users).toEqual({ x: 5, y: 5 });
    expect(resolved.posts).toBeDefined();
  });

  it('forceRelayout discards stored positions entirely', () => {
    const schema = parseDbml(`Table users { id integer [pk] }`);
    const stored = { users: { x: 5, y: 5 } };
    const resolved = resolvePositions(schema, stored, true);
    expect(resolved.users).not.toEqual({ x: 5, y: 5 });
  });

  it('stacks a newly-added table below the existing layout without moving anything already positioned', () => {
    const schema = parseDbml(`
      Table users { id integer [pk] }
      Table posts { id integer [pk] user_id integer }
      Table comments { id integer [pk] post_id integer }
      Ref: posts.user_id > users.id
      Ref: comments.post_id > posts.id
    `);
    const stored = { users: { x: 5, y: 5 }, posts: { x: 400, y: 5 } };
    const resolved = resolvePositions(schema, stored);
    expect(resolved.users).toEqual({ x: 5, y: 5 });
    expect(resolved.posts).toEqual({ x: 400, y: 5 });
    // Placed relative to the existing layout, not dumped at the origin.
    expect(resolved.comments.y).toBeGreaterThan(5);
  });

  it('does not distinguish itself by running a fresh dagre layout when only some tables are missing', () => {
    // Regression guard for the perf fix: previously every incremental
    // "one new table" edit re-ran layoutSchema (dagre) over the whole graph
    // and threw the result away for every table that already had a stored
    // position. Two calls with the same missing table must be deterministic
    // and cheap — dagre's layout is non-deterministic across calls in ways
    // that would make this flaky if it were still in the loop.
    const schema = parseDbml(`
      Table a { id integer [pk] }
      Table b { id integer [pk] }
      Table c { id integer [pk] }
    `);
    const stored = { a: { x: 1, y: 1 }, b: { x: 2, y: 2 } };
    const first = resolvePositions(schema, stored);
    const second = resolvePositions(schema, stored);
    expect(first.c).toEqual(second.c);
  });
});

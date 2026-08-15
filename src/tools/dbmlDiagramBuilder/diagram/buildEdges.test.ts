import { parseDbml } from '../parser/dbmlParser';
import { buildEdges } from './buildEdges';
import { layoutSchema } from './layout';
import type { NodePosition } from '../types';

interface RoutedEdge {
  id: string;
  sourceHandle: string;
  targetHandle: string;
  lane: number | undefined;
}

function route(dbml: string, positions?: Record<string, NodePosition>): RoutedEdge[] {
  const schema = parseDbml(dbml);
  return buildEdges(schema, positions ?? layoutSchema(schema)).map((e) => ({
    id: e.id,
    sourceHandle: e.sourceHandle ?? '',
    targetHandle: e.targetHandle ?? '',
    lane: (e.data as { laneOffset?: number } | undefined)?.laneOffset,
  }));
}

describe('buildEdges lane routing', () => {
  it('gives every edge converging on one column its own lane', () => {
    // Three relationships all terminate at users.id. dagre puts `follows` and
    // `posts` in the same rank, so all three bends land in one corridor and
    // used to draw on top of each other — reading as a phantom line joining
    // `follows` to `posts`.
    const edges = route(`
Table follows {
  following_user_id integer [not null]
  followed_user_id integer [not null]
  created_at timestamp
}
Table users {
  id integer [primary key]
  username varchar
}
Table posts {
  id integer [primary key]
  user_id integer [not null]
}
Ref user_posts: posts.user_id > users.id
Ref: users.id < follows.following_user_id
Ref: users.id < follows.followed_user_id
`);

    expect(edges).toHaveLength(3);
    // All three dock into the same target column from the same side...
    edges.forEach((e) => expect(e.targetHandle).toBe('users__id__left__target'));
    // ...so each must sit on a distinct lane.
    const lanes = edges.map((e) => e.lane);
    expect(new Set(lanes).size).toBe(3);
    expect(lanes.every((l) => typeof l === 'number')).toBe(true);
  });

  it('leaves a lone edge on the corridor centre line', () => {
    const edges = route(`
Table users { id integer [primary key] }
Table posts { user_id integer }
Ref: posts.user_id > users.id
`);
    expect(edges[0].lane).toBeUndefined();
  });

  it('does not shift edges that share a corridor but not a vertical span', () => {
    const edges = route(
      `
Table a { id integer [primary key] }
Table b { id integer [primary key] }
Table c { a_id integer }
Table d { b_id integer }
Ref: c.a_id > a.id
Ref: d.b_id > b.id
`,
      { a: { x: 400, y: 0 }, c: { x: 0, y: 0 }, b: { x: 400, y: 900 }, d: { x: 0, y: 900 } },
    );
    expect(edges.every((e) => e.lane === undefined)).toBe(true);
  });

  it('keeps a self-reference on one side instead of wrapping the table', () => {
    const edges = route(`
Table employees {
  id integer [primary key]
  manager_id integer
}
Ref: employees.manager_id > employees.id
`);
    expect(edges[0].sourceHandle).toBe('employees__manager_id__right__source');
    expect(edges[0].targetHandle).toBe('employees__id__right__target');
    expect(edges[0].lane).toBeUndefined();
  });

  it('chooses handle sides by table centre, not left edge', () => {
    // The wide table's left edge is left of `narrow`, but its centre is well to
    // the right — docking off the left edge would send the edge backwards.
    const edges = route(
      `
Table narrow { id integer [primary key] }
Table wide_table {
  narrow_id integer
  some_extremely_long_column_name varchar
}
Ref: wide_table.narrow_id > narrow.id
`,
      { narrow: { x: 300, y: 0 }, wide_table: { x: 280, y: 0 } },
    );
    expect(edges[0].sourceHandle).toBe('wide_table__narrow_id__left__source');
    expect(edges[0].targetHandle).toBe('narrow__id__right__target');
  });

  it('skips relationships that reference a missing table', () => {
    const edges = route(`
Table users { id integer [primary key] }
Ref: users.id < ghost.user_id
`);
    expect(edges).toHaveLength(0);
  });
});

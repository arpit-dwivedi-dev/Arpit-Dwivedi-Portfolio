import { parseDbml } from '../parser/dbmlParser';
import { buildNodes } from './buildNodes';
import { layoutSchema } from './layout';

function build(dbml: string) {
  const schema = parseDbml(dbml);
  return buildNodes(schema, layoutSchema(schema));
}

describe('buildNodes — schema-qualified node identity', () => {
  it('gives same-named tables in different schemas distinct, non-colliding node ids', () => {
    const nodes = build(`
      Table public.users { id integer [pk] }
      Table auth.users { id integer [pk] }
    `);
    const ids = nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(2);
    expect(ids).toEqual(['public.users', 'auth.users']);
  });

  it('keeps an unqualified table id unchanged (its bare lowercased name)', () => {
    const nodes = build(`Table Users { id integer [pk] }`);
    expect(nodes[0].id).toBe('users');
  });

  it('exposes schema and qualifiedName in node data for display, alongside the plain name', () => {
    const nodes = build(`Table public.users { id integer [pk] }`);
    expect(nodes[0].data).toMatchObject({ name: 'users', schema: 'public', qualifiedName: 'public.users' });
  });

  it('leaves schema undefined in node data for an unqualified table', () => {
    const nodes = build(`Table users { id integer [pk] }`);
    expect(nodes[0].data.schema).toBeUndefined();
    expect(nodes[0].data.qualifiedName).toBe('users');
  });

  it('credits Records row counts to the correct schema-qualified table', () => {
    const nodes = build(`
      Table public.users { id integer [pk] }
      Table auth.users { id integer [pk] }
      Records public.users(id) { 1 \n 2 }
    `);
    const publicUsers = nodes.find((n) => n.id === 'public.users')!;
    const authUsers = nodes.find((n) => n.id === 'auth.users')!;
    expect(publicUsers.data.recordCount).toBe(2);
    expect(authUsers.data.recordCount).toBe(0);
  });

  it('attributes a foreign-key marker to the correct schema-qualified source table', () => {
    const nodes = build(`
      Table public.users { id integer [pk] }
      Table billing.invoices { id integer [pk] user_id integer }
      Ref: public.users.id < billing.invoices.user_id
    `);
    const invoices = nodes.find((n) => n.id === 'billing.invoices')!;
    expect(invoices.data.fkColumnNames).toEqual(['user_id']);
  });
});

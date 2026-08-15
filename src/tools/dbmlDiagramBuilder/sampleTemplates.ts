export const DEFAULT_SAMPLE_DBML = `Table follows {
  following_user_id integer [not null]
  followed_user_id integer [not null]
  created_at timestamp
}

Table users {
  id integer [primary key]
  username varchar
  role varchar
  created_at timestamp
}

Table posts {
  id integer [primary key]
  title varchar
  body text [note: 'Content of the post']
  user_id integer [not null]
  status varchar
  created_at timestamp
}

Ref user_posts: posts.user_id > users.id

Ref: users.id < follows.following_user_id

Ref: users.id < follows.followed_user_id
`;

export interface DbmlTemplate {
  id: string;
  name: string;
  description: string;
  dbml: string;
}

export const TEMPLATES: DbmlTemplate[] = [
  {
    id: 'basic-users-posts',
    name: 'Basic Users / Posts',
    description: 'Users, posts, and a self-referencing follows table.',
    dbml: DEFAULT_SAMPLE_DBML,
  },
  {
    id: 'blog',
    name: 'Blog',
    description: 'Authors, posts, categories, and comments.',
    dbml: `Table authors {
  id integer [primary key, increment]
  name varchar [not null]
  email varchar [unique, not null]
  bio text
}

Table categories {
  id integer [primary key, increment]
  name varchar [not null, unique]
}

Table posts {
  id integer [primary key, increment]
  title varchar [not null]
  slug varchar [unique, not null]
  body text
  author_id integer [not null]
  category_id integer
  published_at timestamp
  created_at timestamp [default: \`now()\`]
}

Table comments {
  id integer [primary key, increment]
  post_id integer [not null]
  author_name varchar [not null]
  body text [not null]
  created_at timestamp [default: \`now()\`]
}

Ref: posts.author_id > authors.id
Ref: posts.category_id > categories.id
Ref: comments.post_id > posts.id
`,
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Customers, products, orders, and order line items.',
    dbml: `Table customers {
  id integer [primary key, increment]
  email varchar [unique, not null]
  full_name varchar [not null]
  created_at timestamp
}

Table products {
  id integer [primary key, increment]
  sku varchar [unique, not null]
  name varchar [not null]
  price decimal(10,2) [not null]
  stock integer [default: 0]
}

Table orders {
  id integer [primary key, increment]
  customer_id integer [not null]
  status varchar [default: 'pending']
  total decimal(10,2)
  created_at timestamp
}

Table order_items {
  id integer [primary key, increment]
  order_id integer [not null]
  product_id integer [not null]
  quantity integer [not null, default: 1]
  unit_price decimal(10,2) [not null]
}

Ref: orders.customer_id > customers.id
Ref: order_items.order_id > orders.id
Ref: order_items.product_id > products.id
`,
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Companies, contacts, deals, and activities.',
    dbml: `Table companies {
  id integer [primary key, increment]
  name varchar [not null]
  domain varchar [unique]
  created_at timestamp
}

Table contacts {
  id integer [primary key, increment]
  company_id integer
  first_name varchar [not null]
  last_name varchar
  email varchar [unique]
  phone varchar
}

Table deals {
  id integer [primary key, increment]
  company_id integer [not null]
  contact_id integer
  title varchar [not null]
  stage varchar [default: 'prospecting']
  value decimal(12,2)
  closed_at timestamp
}

Table activities {
  id integer [primary key, increment]
  deal_id integer [not null]
  type varchar [not null, note: 'call, email, meeting, note']
  notes text
  created_at timestamp
}

Ref: contacts.company_id > companies.id
Ref: deals.company_id > companies.id
Ref: deals.contact_id > contacts.id
Ref: activities.deal_id > deals.id
`,
  },
  {
    id: 'auth',
    name: 'Authentication',
    description: 'Users, roles, permissions, and sessions.',
    dbml: `Table users {
  id integer [primary key, increment]
  email varchar [unique, not null]
  password_hash varchar [not null]
  is_active boolean [default: true]
  created_at timestamp
}

Table roles {
  id integer [primary key, increment]
  name varchar [unique, not null]
}

Table permissions {
  id integer [primary key, increment]
  name varchar [unique, not null]
}

Table role_permissions {
  role_id integer [not null]
  permission_id integer [not null]
}

Table user_roles {
  user_id integer [not null]
  role_id integer [not null]
}

Table sessions {
  id varchar [primary key]
  user_id integer [not null]
  expires_at timestamp
  created_at timestamp
}

Ref: role_permissions.role_id > roles.id
Ref: role_permissions.permission_id > permissions.id
Ref: user_roles.user_id > users.id
Ref: user_roles.role_id > roles.id
Ref: sessions.user_id > users.id
`,
  },
];

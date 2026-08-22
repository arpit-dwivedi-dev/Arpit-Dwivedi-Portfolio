import metadata from '../../metadata.json';

export interface Project {
  title: string;
  description: string;
  tags: string[];
  metrics?: { label: string; value: string }[];
  link?: string;
  github?: string;
  subtitle?: string;
  featured?: boolean;
  /** Unpaid concept/demo work, never adopted by the client — rendered in its
   *  own clearly-labeled "not in production" bucket, never blended with
   *  delivered work. Absent (not `false`) means real, delivered, paid work. */
  status?: 'demo';
  /** Bare display domain shown beside the title, e.g. "example.org". Only set
   *  it on work that is actually reachable there — a demo has no host. */
  host?: string;
  /** The row's one remark: what's notable about the build for delivered work,
   *  what its real status is for a concept. Rendered in violet, the site's
   *  colour for a note about the work rather than a thing that is running. */
  note?: string;
  /** Which stage fragment to draw in the row's right-hand panel. Unknown or
   *  absent renders no panel and the row reflows to two columns. */
  stage?: string;
}

export type SiteContent = Omit<typeof metadata.content, 'projects'> & { projects: Project[] };

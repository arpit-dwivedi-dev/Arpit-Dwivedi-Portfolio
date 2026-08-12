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
}

export type SiteContent = Omit<typeof metadata.content, 'projects'> & { projects: Project[] };
export type Lang = 'en' | 'hi';

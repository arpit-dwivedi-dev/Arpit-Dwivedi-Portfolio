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
}

export type SiteContent = Omit<typeof metadata.content, 'projects'> & { projects: Project[] };
export type Lang = 'en' | 'hi';

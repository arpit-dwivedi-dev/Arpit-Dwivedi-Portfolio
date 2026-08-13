export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface BlogFaqItem {
  question: string;
  answer: string;
}

export interface BlogComparisonRow {
  label: string;
  /** One value per entry in BlogComparisonTable.columns, same order. */
  values: string[];
}

export interface BlogComparisonTable {
  columns: string[];
  rows: BlogComparisonRow[];
}

export interface BlogPost {
  slug: string;
  title: string;
  /** Meta description + card excerpt — kept under ~160 chars. */
  description: string;
  category: string;
  readTimeMinutes: number;
  publishedDate: string;
  updatedDate: string;
  intro: string[];
  sections: BlogSection[];
  comparisonTable?: BlogComparisonTable;
  faq: BlogFaqItem[];
  relatedSlugs: string[];
}

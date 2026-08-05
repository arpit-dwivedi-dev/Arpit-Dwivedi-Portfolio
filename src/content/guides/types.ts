export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface GuideFaqItem {
  question: string;
  answer: string;
}

export interface Guide {
  slug: string;
  title: string;
  /** Meta description + card excerpt — kept under ~160 chars. */
  description: string;
  category: string;
  readTimeMinutes: number;
  publishedDate: string;
  updatedDate: string;
  intro: string[];
  sections: GuideSection[];
  faq: GuideFaqItem[];
  relatedSlugs: string[];
}

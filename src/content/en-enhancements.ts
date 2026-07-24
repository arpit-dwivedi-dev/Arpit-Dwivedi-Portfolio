import metadata from '../../metadata.json';
import type { SiteContent } from '../i18n/types';

// Small enhancements to the English content used for SEO and conversion —
// kept separate so translations remain unchanged. This file augments the
// existing metadata.content object at runtime where needed.

export const seoContent: Partial<SiteContent> = {
  hero: metadata.content.hero as any,
  featuredProject: metadata.content.featuredProject as any,
  about: metadata.content.about as any,
  techStackSection: metadata.content.techStackSection as any,
  localTrust: metadata.content.localTrust as any,
  process: metadata.content.process as any,
  testimonialsSection: metadata.content.testimonialsSection as any,
};

export default seoContent;

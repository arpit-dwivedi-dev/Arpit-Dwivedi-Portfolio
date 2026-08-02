import { MapPin, type LucideIcon } from 'lucide-react';

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Route segment under /free-tools (or /hi/free-tools). */
  path: string;
}

// Adding tool #2 is a new entry here — ToolCard and FreeToolsPage don't change.
export const TOOLS: ToolDefinition[] = [
  {
    id: 'google-maps-scraper',
    title: 'Google Maps Scraper',
    description: 'Pull the name, address, phone, website, rating, and hours off a Google Maps search into a table you can export as CSV.',
    icon: MapPin,
    path: 'google-maps-scraper',
  },
];

import { useEffect } from 'react';

interface JsonLdProps {
  data: object;
}

// Injects one <script type="application/ld+json"> into <head> for the
// lifetime of the owning component — used for schema that's specific to a
// single route (BreadcrumbList, per-tool SoftwareApplication/FAQPage, Article)
// as opposed to the site-wide graph already static in index.html.
export const JsonLd = ({ data }: JsonLdProps) => {
  const serialized = JSON.stringify(data);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = serialized;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [serialized]);

  return null;
};

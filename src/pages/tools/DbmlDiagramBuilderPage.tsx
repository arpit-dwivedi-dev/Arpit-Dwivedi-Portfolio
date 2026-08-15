import { DbmlDiagramBuilderApp } from '../../components/tools/dbmlDiagramBuilder/DbmlDiagramBuilderApp';
import { ErrorBoundary } from '../../components/tools/dbmlDiagramBuilder/ErrorBoundary';
import { JsonLd } from '../../components/seo/JsonLd';
import { useMediaQuery } from '../../tools/dbmlDiagramBuilder/hooks/useMediaQuery';
import { useVisualViewportHeight } from '../../tools/dbmlDiagramBuilder/hooks/useVisualViewportHeight';

const SITE_ORIGIN = 'https://101techlabs.com';
const TOOL_URL = `${SITE_ORIGIN}/tools/developer/dbml-diagram-builder`;

export function DbmlDiagramBuilderPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const viewportHeight = useVisualViewportHeight(isMobile);

  return (
    // On phones the app is pinned to the visual viewport so the on-screen
    // keyboard shrinks it instead of pushing its header/status bar off screen.
    // `h-dvh` stays as the fallback until visualViewport reports a height.
    <div
      // Positioned either way (`fixed` on mobile, `relative` otherwise) so it
      // is the box the tool's dialogs anchor to.
      className={`w-full overflow-hidden bg-slate-950 h-dvh ${isMobile ? 'fixed inset-x-0 top-0' : 'relative'}`}
      style={isMobile && viewportHeight ? { height: `${viewportHeight}px` } : undefined}
    >
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'DBML Diagram Builder',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any (runs in browser)',
          url: TOOL_URL,
          description:
            'Write DBML and see a live, interactive ER diagram in your browser. Import/export DBML, PNG, and SVG, with local save and shareable links — no signup, no server.',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />
      <ErrorBoundary>
        <DbmlDiagramBuilderApp />
      </ErrorBoundary>
    </div>
  );
}

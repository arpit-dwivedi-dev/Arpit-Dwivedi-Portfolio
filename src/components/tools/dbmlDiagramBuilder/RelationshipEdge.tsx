import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { useDbmlTheme } from './DbmlThemeContext';

interface RelationshipEdgeData extends Record<string, unknown> {
  highlighted?: boolean;
  /** Horizontal shift applied to the step-path bend so edges converging on
   * the same side of the same table (see buildEdges) don't overlap. */
  laneOffset?: number;
}

const DOT_OFFSETS = [0, -0.55, -1.1] as const;

// Small circles animated along the edge path via SMIL <animateMotion> — a
// continuous "flow" of dots from the FK (many) side to the PK (one) side, so
// the direction of a reference is legible at a glance instead of just an
// arrowhead. Staggered `begin` offsets keep the stream looking continuous
// rather than one dot chasing an empty line.
function RelationshipEdgeImpl({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  data,
}: EdgeProps) {
  const edgeData = data as RelationshipEdgeData | undefined;
  const laneOffset = edgeData?.laneOffset ?? 0;
  const theme = useDbmlTheme();
  const dotColor = theme === 'dark' ? '#64748b' : '#94a3b8';
  const labelColor = theme === 'dark' ? '#cbd5e1' : '#64748b';
  const labelBg = theme === 'dark' ? '#1e293b' : '#ffffff';

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    // Matches the library's own default midpoint (sourceX+targetX)/2 when
    // laneOffset is 0, so unaffected edges render exactly as before.
    ...(laneOffset ? { centerX: (sourceX + targetX) / 2 + laneOffset } : {}),
  });

  const highlighted = Boolean(edgeData?.highlighted);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: highlighted ? '#2563eb' : style?.stroke,
          strokeWidth: highlighted ? 2.25 : (style?.strokeWidth as number | undefined) ?? 1.5,
          transition: 'stroke 150ms ease, stroke-width 150ms ease',
        }}
      />
      {DOT_OFFSETS.map((offset) => (
        <circle key={offset} r={highlighted ? 3 : 2.25} fill={highlighted ? '#2563eb' : dotColor}>
          <animateMotion
            dur={highlighted ? '1.1s' : '1.8s'}
            begin={`${offset}s`}
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      ))}
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: (labelStyle?.fontSize as number | undefined) ?? 10,
              fontWeight: (labelStyle?.fontWeight as number | undefined) ?? 600,
              // `labelStyle.fill` is the SVG-text convention this data comes
              // in as — translate it to the CSS property a <div> actually
              // honors. Left as `fill`, it's silently ignored and the label
              // inherits the page's text color instead (invisible: white on
              // white here, since the app defaults to a dark text color).
              color: (labelStyle?.fill as string | undefined) ?? labelColor,
              background: (labelBgStyle?.fill as string | undefined) ?? labelBg,
              padding: labelBgPadding ? `${labelBgPadding[1]}px ${labelBgPadding[0]}px` : '2px 4px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeImpl);

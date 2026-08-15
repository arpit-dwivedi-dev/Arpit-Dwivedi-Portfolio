import { toPng, toSvg } from 'html-to-image';
import { getNodesBounds, type Node } from '@xyflow/react';
import { downloadDataUrl } from './download';

const PADDING = 80;
const MAX_DIMENSION = 3000;

function computeExportFrame(nodes: Node[]) {
  const bounds = getNodesBounds(nodes);
  const rawWidth = bounds.width + PADDING * 2;
  const rawHeight = bounds.height + PADDING * 2;
  // Only shrink, and only to keep a very large schema under MAX_DIMENSION.
  const zoom = Math.min(1, MAX_DIMENSION / Math.max(rawWidth, rawHeight, 1));
  const width = Math.max(1, Math.round(rawWidth * zoom));
  const height = Math.max(1, Math.round(rawHeight * zoom));
  // Place the top-left node PADDING in from the frame's corner. (React Flow's
  // getViewportForBounds takes its padding as a *ratio*, not pixels — feeding
  // it 80 asked for 80× the bounds as margin, which is what shrank exported
  // diagrams to a speck in the middle of a mostly empty image.)
  const viewport = { x: (PADDING - bounds.x) * zoom, y: (PADDING - bounds.y) * zoom, zoom };
  return { width, height, viewport };
}

type Capture = typeof toPng;

async function captureViewport(container: HTMLElement, nodes: Node[], capture: Capture): Promise<string | null> {
  const viewportEl = container.querySelector<HTMLElement>('.react-flow__viewport');
  if (!viewportEl || nodes.length === 0) return null;
  const { width, height, viewport } = computeExportFrame(nodes);
  return capture(viewportEl, {
    backgroundColor: '#ffffff',
    width,
    height,
    pixelRatio: 2,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  });
}

export async function exportDiagramAsPng(container: HTMLElement, nodes: Node[], filename: string): Promise<boolean> {
  const dataUrl = await captureViewport(container, nodes, toPng);
  if (!dataUrl) return false;
  downloadDataUrl(filename, dataUrl);
  return true;
}

export async function exportDiagramAsSvg(container: HTMLElement, nodes: Node[], filename: string): Promise<boolean> {
  const dataUrl = await captureViewport(container, nodes, toSvg);
  if (!dataUrl) return false;
  downloadDataUrl(filename, dataUrl);
  return true;
}

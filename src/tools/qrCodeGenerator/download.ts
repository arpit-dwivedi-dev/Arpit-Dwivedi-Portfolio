const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const downloadCanvasAsPng = (canvas: HTMLCanvasElement, filename: string): void => {
  canvas.toBlob((blob) => {
    if (blob) triggerDownload(blob, filename);
  }, 'image/png');
};

export const downloadSvgElement = (svg: SVGSVGElement, filename: string): void => {
  const serialized = new XMLSerializer().serializeToString(svg);
  const source = `<?xml version="1.0" standalone="no"?>\r\n${serialized}`;
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, filename);
};

// Feature-detects Clipboard API image support (Safari/older Firefox lack
// ClipboardItem) — callers should hide/disable the copy action on `false`
// rather than surface an error.
export const copyCanvasToClipboard = async (canvas: HTMLCanvasElement): Promise<boolean> => {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') return false;
  try {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
};

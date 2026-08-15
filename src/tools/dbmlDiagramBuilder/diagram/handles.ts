/**
 * Every column row exposes a source AND a target handle on both its left and
 * right edge, so an edge can dock at that exact row from whichever side the
 * other table sits on. `buildEdges` picks the side; this just keeps the id
 * format in one place so TableNode and buildEdges never drift apart.
 */
export function columnHandleId(columnId: string, side: 'left' | 'right', kind: 'source' | 'target'): string {
  return `${columnId}__${side}__${kind}`;
}

import { copyTextToClipboard } from '../../../lib/clipboard';

export async function copyDbmlToClipboard(text: string): Promise<boolean> {
  return copyTextToClipboard(text);
}

import { copyDbmlToClipboard } from './copyToClipboard';

describe('copyDbmlToClipboard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockClipboard(writeText: (text: string) => Promise<void>) {
    Object.defineProperty(global, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
    });
  }

  it('copies normal DBML text exactly, unmodified', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    const dbml = 'Table users {\n  id int [pk]\n  name varchar\n}';
    const ok = await copyDbmlToClipboard(dbml);

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(dbml);
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it('copies an empty editor as an empty string', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    const ok = await copyDbmlToClipboard('');

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('');
  });

  it('copies malformed DBML content verbatim without attempting to fix it', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    const malformed = 'Table users {\n  id int [pk\n  name varchar}';
    const ok = await copyDbmlToClipboard(malformed);

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(malformed);
  });

  it('copies large DBML content in full', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    const large = Array.from({ length: 5000 }, (_, i) => `Table t${i} { id int [pk] }`).join('\n');
    const ok = await copyDbmlToClipboard(large);

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(large);
  });

  it('returns false when the Clipboard API rejects', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'));
    mockClipboard(writeText);

    const ok = await copyDbmlToClipboard('Table users { id int }');

    expect(ok).toBe(false);
  });

  it('returns false when the Clipboard API is unavailable', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {},
      configurable: true,
    });

    const ok = await copyDbmlToClipboard('Table users { id int }');

    expect(ok).toBe(false);
  });
});

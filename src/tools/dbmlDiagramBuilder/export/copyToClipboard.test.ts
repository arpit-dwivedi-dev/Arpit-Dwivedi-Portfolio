import { copyDbmlToClipboard } from './copyToClipboard';

describe('copyDbmlToClipboard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // These run under jest's `node` environment, so `window`/`document` are stubbed
  // the same way `navigator` already was — enough surface for the two branches
  // copyTextToClipboard takes, without pulling in a DOM environment.
  let appended: FakeTextarea[];
  let removed: FakeTextarea[];

  interface FakeTextarea {
    value: string;
    style: Record<string, string>;
    setAttribute: (name: string, value: string) => void;
    select: () => void;
    setSelectionRange: (start: number, end: number) => void;
  }

  function setSecureContext(isSecureContext: boolean) {
    (global as unknown as { window: unknown }).window = { isSecureContext };
  }

  beforeEach(() => {
    appended = [];
    removed = [];
    setSecureContext(true);
    (global as unknown as { document: unknown }).document = {
      activeElement: null,
      createElement: (): FakeTextarea => ({
        value: '',
        style: {},
        setAttribute: () => {},
        select: () => {},
        setSelectionRange: () => {},
      }),
      body: {
        appendChild: (node: FakeTextarea) => appended.push(node),
        removeChild: (node: FakeTextarea) => removed.push(node),
      },
      // Overridden per-test by mockExecCommand; defaults to "fallback unavailable".
      execCommand: () => false,
    };
  });

  afterEach(() => {
    delete (global as unknown as { window?: unknown }).window;
    delete (global as unknown as { document?: unknown }).document;
  });

  function mockClipboard(writeText: (text: string) => Promise<void>) {
    Object.defineProperty(global, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
    });
  }

  /** Stubs the synchronous execCommand fallback, returning the text it observed
   *  in the staging textarea so a test can assert the fallback actually ran. */
  function mockExecCommand(succeeds: boolean) {
    const copied: string[] = [];
    (global as unknown as { document: { execCommand: unknown } }).document.execCommand = jest.fn(() => {
      const textarea = appended[appended.length - 1];
      if (textarea) copied.push(textarea.value);
      return succeeds;
    });
    return copied;
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

  it('falls back to execCommand when the Clipboard API rejects', async () => {
    mockClipboard(jest.fn().mockRejectedValue(new Error('denied')));
    const copied = mockExecCommand(true);

    const ok = await copyDbmlToClipboard('Table users { id int }');

    expect(ok).toBe(true);
    expect(copied).toEqual(['Table users { id int }']);
  });

  it('falls back to execCommand when the Clipboard API is unavailable', async () => {
    Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
    const copied = mockExecCommand(true);

    const ok = await copyDbmlToClipboard('Table users { id int }');

    expect(ok).toBe(true);
    expect(copied).toEqual(['Table users { id int }']);
  });

  it('falls back to execCommand in an insecure context without touching the Clipboard API', async () => {
    setSecureContext(false);
    const writeText = jest.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    const copied = mockExecCommand(true);

    const ok = await copyDbmlToClipboard('Table users { id int }');

    expect(ok).toBe(true);
    expect(writeText).not.toHaveBeenCalled();
    expect(copied).toEqual(['Table users { id int }']);
  });

  it('returns false only when both the Clipboard API and the fallback fail', async () => {
    Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
    mockExecCommand(false);

    const ok = await copyDbmlToClipboard('Table users { id int }');

    expect(ok).toBe(false);
  });

  it('leaves no stray textarea behind after the fallback runs', async () => {
    Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
    mockExecCommand(true);

    await copyDbmlToClipboard('Table users { id int }');

    expect(appended).toHaveLength(1);
    expect(removed).toEqual(appended);
  });
});

import { createStorageWarningTracker } from './storageWarningTracker';

describe('createStorageWarningTracker', () => {
  it('never notifies while every save succeeds', () => {
    const onChange = jest.fn();
    const report = createStorageWarningTracker(onChange);

    report(true);
    report(true);
    report(true);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('notifies once, with true, on the first failure', () => {
    const onChange = jest.fn();
    const report = createStorageWarningTracker(onChange);

    report(false);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not notify again for repeated failures (bounded event count)', () => {
    const onChange = jest.fn();
    const report = createStorageWarningTracker(onChange);

    for (let i = 0; i < 200; i++) report(false);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('clears the warning exactly once a save succeeds again', () => {
    const onChange = jest.fn();
    const report = createStorageWarningTracker(onChange);

    report(false);
    report(false);
    report(true);
    report(true);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, false);
  });

  it('handles storage flapping (works, then fails, then works again)', () => {
    const onChange = jest.fn();
    const report = createStorageWarningTracker(onChange);

    report(true); // healthy start, no event
    report(false); // becomes unavailable
    report(false); // stays unavailable — no extra event
    report(true); // recovers

    expect(onChange.mock.calls).toEqual([[true], [false]]);
  });
});

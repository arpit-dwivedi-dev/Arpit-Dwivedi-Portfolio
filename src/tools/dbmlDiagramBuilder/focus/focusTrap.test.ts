import { isFocusCandidateEligible, resolveTabWrap } from './focusTrap';

describe('isFocusCandidateEligible', () => {
  it('accepts a plain enabled, visible element', () => {
    expect(isFocusCandidateEligible({})).toBe(true);
  });

  it('rejects a disabled element', () => {
    expect(isFocusCandidateEligible({ disabled: true })).toBe(false);
  });

  it('rejects an aria-hidden element', () => {
    expect(isFocusCandidateEligible({ ariaHidden: true })).toBe(false);
  });

  it('rejects an element with no client rects (not rendered/visible)', () => {
    expect(isFocusCandidateEligible({ visible: false })).toBe(false);
  });

  it('rejects a negative tabIndex', () => {
    expect(isFocusCandidateEligible({ tabIndex: -1 })).toBe(false);
  });

  it('accepts a positive tabIndex', () => {
    expect(isFocusCandidateEligible({ tabIndex: 3 })).toBe(true);
  });
});

describe('resolveTabWrap', () => {
  it('wraps Tab from the last element to the first', () => {
    expect(resolveTabWrap({ count: 3, currentIndex: 2, shiftKey: false })).toBe(0);
  });

  it('wraps Shift+Tab from the first element to the last', () => {
    expect(resolveTabWrap({ count: 3, currentIndex: 0, shiftKey: true })).toBe(2);
  });

  it('leaves Tab alone when moving between middle elements', () => {
    expect(resolveTabWrap({ count: 3, currentIndex: 1, shiftKey: false })).toBeNull();
  });

  it('leaves Shift+Tab alone when moving between middle elements', () => {
    expect(resolveTabWrap({ count: 3, currentIndex: 1, shiftKey: true })).toBeNull();
  });

  it('pulls focus back to the first element if it somehow escaped the trap on Tab', () => {
    expect(resolveTabWrap({ count: 3, currentIndex: -1, shiftKey: false })).toBe(0);
  });

  it('pulls focus back to the last element if it somehow escaped the trap on Shift+Tab', () => {
    expect(resolveTabWrap({ count: 3, currentIndex: -1, shiftKey: true })).toBe(2);
  });

  it('does nothing when there are no focusable elements', () => {
    expect(resolveTabWrap({ count: 0, currentIndex: -1, shiftKey: false })).toBeNull();
    expect(resolveTabWrap({ count: 0, currentIndex: -1, shiftKey: true })).toBeNull();
  });

  it('treats a single focusable element as both first and last', () => {
    expect(resolveTabWrap({ count: 1, currentIndex: 0, shiftKey: false })).toBe(0);
    expect(resolveTabWrap({ count: 1, currentIndex: 0, shiftKey: true })).toBe(0);
  });
});

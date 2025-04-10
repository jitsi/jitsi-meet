import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAspectRatio } from './useAspectRatio';

describe('useAspectRatio', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  const RATIO_16_BY_9 = 16 / 9;

  const DEFAULT_HEIGHT = 900;
  const EXACT_16_BY_9_WIDTH = Math.round(DEFAULT_HEIGHT * RATIO_16_BY_9);
  const WIDER_THAN_16_BY_9_WIDTH = 1920;
  const LESS_WIDE_THAN_16_BY_9_WIDTH = 1200;

  const RESIZE_HEIGHT = 1080;
  const RESIZE_WIDTH = 2560;
  const RESIZE_RATIO = RESIZE_WIDTH / RESIZE_HEIGHT;

  let resizeCallback: (() => void) | null = null;

  beforeEach(() => {
    vi.spyOn(window, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'resize') {
        resizeCallback = callback as () => void;
      }
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight });
    vi.restoreAllMocks();
  });

  it('should return the correct aspect ratio', () => {
    Object.defineProperty(window, 'innerWidth', { value: EXACT_16_BY_9_WIDTH });
    Object.defineProperty(window, 'innerHeight', { value: DEFAULT_HEIGHT });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.aspectRatio).toBeCloseTo(RATIO_16_BY_9, 3);
  });

  it('should correctly detect when the ratio is wider than 16:9', () => {
    Object.defineProperty(window, 'innerWidth', { value: WIDER_THAN_16_BY_9_WIDTH });
    Object.defineProperty(window, 'innerHeight', { value: DEFAULT_HEIGHT });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.isWiderThan16by9).toBe(true);
  });

  it('should correctly detect when the ratio is exactly 16:9', () => {
    Object.defineProperty(window, 'innerWidth', { value: EXACT_16_BY_9_WIDTH });
    Object.defineProperty(window, 'innerHeight', { value: DEFAULT_HEIGHT });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.aspectRatio).toBeCloseTo(RATIO_16_BY_9, 3);
    expect(result.current.isWiderThan16by9).toBe(false);
  });

  it('should correctly detect when the ratio is less wide than 16:9', () => {
    Object.defineProperty(window, 'innerWidth', { value: LESS_WIDE_THAN_16_BY_9_WIDTH });
    Object.defineProperty(window, 'innerHeight', { value: DEFAULT_HEIGHT });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.isWiderThan16by9).toBe(false);
  });

  it('should provide the correct containerStyle for windows wider than 16:9', () => {
    Object.defineProperty(window, 'innerWidth', { value: WIDER_THAN_16_BY_9_WIDTH });
    Object.defineProperty(window, 'innerHeight', { value: DEFAULT_HEIGHT });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.containerStyle).toEqual({
      maxWidth: `${DEFAULT_HEIGHT * RATIO_16_BY_9}px`,
      margin: '0 auto'
    });
  });

  it('should provide an empty containerStyle for windows less wide than 16:9', () => {
    Object.defineProperty(window, 'innerWidth', { value: LESS_WIDE_THAN_16_BY_9_WIDTH });
    Object.defineProperty(window, 'innerHeight', { value: DEFAULT_HEIGHT });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.containerStyle).toEqual({});
  });

  it('should update values when window size changes', () => {
    Object.defineProperty(window, 'innerWidth', { value: EXACT_16_BY_9_WIDTH });
    Object.defineProperty(window, 'innerHeight', { value: DEFAULT_HEIGHT });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.aspectRatio).toBeCloseTo(RATIO_16_BY_9, 3);
    expect(result.current.isWiderThan16by9).toBe(false);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: RESIZE_WIDTH });
      Object.defineProperty(window, 'innerHeight', { value: RESIZE_HEIGHT });
      if (resizeCallback) {
        resizeCallback();
      }
    });

    expect(result.current.aspectRatio).toBeCloseTo(RESIZE_RATIO, 2);
    expect(result.current.isWiderThan16by9).toBe(true);
    expect(result.current.containerStyle).toEqual({
      maxWidth: `${RESIZE_HEIGHT * RATIO_16_BY_9}px`,
      margin: '0 auto'
    });
  });

  it('should remove the event listener when component unmounts', () => {
    const { unmount } = renderHook(() => useAspectRatio());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
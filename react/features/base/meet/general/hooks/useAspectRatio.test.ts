import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAspectRatio } from './useAspectRatio';

describe('useAspectRatio', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  let resizeCallback;

  beforeEach(() => {
    vi.spyOn(window, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'resize') {
        resizeCallback = callback;
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
    Object.defineProperty(window, 'innerWidth', { value: 1600 });
    Object.defineProperty(window, 'innerHeight', { value: 900 });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.aspectRatio).toBeCloseTo(1.778, 3);
  });

  it('should correctly detect when the ratio is wider than 16:9', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1920 });
    Object.defineProperty(window, 'innerHeight', { value: 900 });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.isWiderThan16by9).toBe(true);
  });

  it('should correctly detect when the ratio is exactly 16:9', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1600 });
    Object.defineProperty(window, 'innerHeight', { value: 900 });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.aspectRatio).toBeCloseTo(16/9, 3);
    expect(result.current.isWiderThan16by9).toBe(false);
  });

  it('should correctly detect when the ratio is less wide than 16:9', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200 });
    Object.defineProperty(window, 'innerHeight', { value: 900 });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.isWiderThan16by9).toBe(false);
  });

  it('should provide the correct containerStyle for windows wider than 16:9', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1920 });
    Object.defineProperty(window, 'innerHeight', { value: 900 });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.containerStyle).toEqual({
      maxWidth: `${900 * (16/9)}px`,
      margin: '0 auto'
    });
  });

  it('should provide an empty containerStyle for windows less wide than 16:9', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200 });
    Object.defineProperty(window, 'innerHeight', { value: 900 });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.containerStyle).toEqual({});
  });

  it('should update values when window size changes', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1600 });
    Object.defineProperty(window, 'innerHeight', { value: 900 });

    const { result } = renderHook(() => useAspectRatio());

    expect(result.current.aspectRatio).toBeCloseTo(1.778, 3);
    expect(result.current.isWiderThan16by9).toBe(false);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 2560 });
      Object.defineProperty(window, 'innerHeight', { value: 1080 });
      resizeCallback();
    });

    expect(result.current.aspectRatio).toBeCloseTo(2.37, 2);
    expect(result.current.isWiderThan16by9).toBe(true);
    expect(result.current.containerStyle).toEqual({
      maxWidth: `${1080 * (16/9)}px`,
      margin: '0 auto'
    });
  });

  it('should remove the event listener when component unmounts', () => {
    const { unmount } = renderHook(() => useAspectRatio());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
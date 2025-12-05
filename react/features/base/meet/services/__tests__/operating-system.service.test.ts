import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import operatingSystemService from '../operating-system.service';

describe('operating-system service', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  const mockNavigatorWithAppVersion = (appVersion: string) => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        appVersion,
      },
      writable: true,
      configurable: true,
    });
  };

  const mockNavigator = (nav: {
    userAgentData?: {
      platform: string;
    };
    userAgent?: string;
    appVersion?: string;
  }) => {
    Object.defineProperty(globalThis, 'navigator', {
      value: nav,
      writable: true,
      configurable: true,
    });
  };

  describe('getOperatingSystem', () => {
    it('should detect Windows OS', () => {
      mockNavigatorWithAppVersion('5.0 (Windows NT 10.0; Win64; x64)');

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('Windows');
    });

    it('should detect macOS', () => {
      mockNavigatorWithAppVersion('5.0 (Macintosh; Intel Mac OS X 10_15_7)');

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('macOS');
    });

    it('should detect UNIX OS when X11 is present without Linux keyword', () => {
      mockNavigatorWithAppVersion('5.0 (X11; FreeBSD)');

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('UNIX');
    });

    it('should detect Linux OS', () => {
      mockNavigatorWithAppVersion('5.0 (Linux; Android 10)');

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('Linux');
    });

    it('should return "Unknown" for unrecognized OS', () => {
      mockNavigatorWithAppVersion('5.0 (Unknown OS)');

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('Unknown');
    });

    it('should detect Linux OS when both X11 and Linux are present', () => {
      mockNavigatorWithAppVersion('5.0 (X11; Ubuntu; Linux x86_64)');

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('Linux');
    });

    it('should prefer userAgentData.platform over userAgent/appVersion', () => {
      mockNavigator({
        userAgentData: { platform: 'Win32' },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      });

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('Windows');
    });

    it('should detect Android from userAgent when Android appears without Linux', () => {
      mockNavigator({
        userAgent: 'Mozilla/5.0 (Android 9; Mobile) AppleWebKit/537.36',
      });

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('Android');
    });

    it('should detect iOS from userAgent (iPhone)', () => {
      mockNavigator({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5)',
      });

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('iOS');
    });

    it('should detect Android from userAgentData.platform', () => {
      mockNavigator({
        userAgentData: { platform: 'Android' },
      });

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('Android');
    });

    it('should detect iOS from userAgentData.platform', () => {
      mockNavigator({
        userAgentData: { platform: 'iOS' },
      });

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('iOS');
    });

    it('should detect Windows from userAgentData.platform', () => {
      mockNavigator({
        userAgentData: { platform: 'Windows' },
      });

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('Windows');
    });

    it('should detect macOS from userAgentData.platform', () => {
      mockNavigator({
        userAgentData: { platform: 'MacOS' },
      });

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('macOS');
    });

    it('should detect macOS from userAgentData.platform', () => {
      mockNavigator({
        userAgentData: { platform: 'Linux' },
      });

      const result = operatingSystemService.getOperatingSystem();

      expect(result).toBe('Linux');
    });
  });
});

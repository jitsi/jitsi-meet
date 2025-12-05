import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import operatingSystemService, { OperatingSystem } from '../operating-system.service';
import desktopService from '../desktop.service';


describe('desktopService', () => {
  const mockFetch = vi.fn();
  const mockPlatforms = {
    platforms: {
      Linux: 'https://internxt.com/downloads/drive-latest.deb',
      Windows: 'https://internxt.com/downloads/drive-latest.exe',
      MacOS: 'https://internxt.com/downloads/drive-latest.dmg',
    },
  };

  const testGetDownloadUrl = async (os: OperatingSystem, platforms: Record<string, unknown> = mockPlatforms) => {
    mockFetch.mockResolvedValueOnce({ json: async () => platforms });
    vi.spyOn(operatingSystemService, 'getOperatingSystem').mockReturnValue(os);
    return desktopService.getDownloadAppUrl();
  };

  beforeEach(() => {
    globalThis.fetch = mockFetch;
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getDownloadAppUrl', () => {
    it('should fetch from API and return correct URL for each OS', async () => {
      expect(await testGetDownloadUrl('Linux')).toBe('https://internxt.com/downloads/drive-latest.deb');
      expect(mockFetch).toHaveBeenCalledWith('https://internxt.com/api/download', { method: 'GET' });

      expect(await testGetDownloadUrl('UNIX')).toBe('https://internxt.com/downloads/drive-latest.deb');
      expect(await testGetDownloadUrl('Windows')).toBe('https://internxt.com/downloads/drive-latest.exe');
      expect(await testGetDownloadUrl('macOS')).toBe('https://internxt.com/downloads/drive-latest.dmg');
    });

    it('should return fallback URLs when API does not provide platform URL', async () => {
      const emptyPlatforms = { platforms: {} };
      expect(await testGetDownloadUrl('Linux', emptyPlatforms)).toBe('https://internxt.com/downloads/drive.deb');
      expect(await testGetDownloadUrl('Windows', emptyPlatforms)).toBe('https://internxt.com/downloads/drive.exe');
      expect(await testGetDownloadUrl('macOS', emptyPlatforms)).toBe('https://internxt.com/downloads/drive.dmg');
    });

    it('should return undefined for unrecognized OS', async () => {
      expect(await testGetDownloadUrl('Unknown', { platforms: {} })).toBeNull();
    });
  });
});

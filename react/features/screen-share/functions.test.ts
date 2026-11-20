import { afterEach, describe, expect, it, vi } from 'vitest';

import { IReduxState } from '../app/types';

const env = vi.hoisted(() => {
    return {
        electron: true,
        electronVersion: 42,
        mobile: false,
        os: 'macos'
    };
});

vi.mock('../base/lib-jitsi-meet', () => {
    return {
        browser: {
            isChromiumBased: () => true,
            isElectron: () => env.electron,
            isVersionGreaterThan: (version: number) => env.electronVersion > version
        }
    };
});
vi.mock('../base/environment/environment', () => {
    return {
        isMacOS: () => env.os === 'macos',
        isWindows: () => env.os === 'windows'
    };
});
vi.mock('../base/environment/utils', () => ({ isMobileBrowser: () => env.mobile }));
vi.mock('../base/tracks/functions', () => ({ getLocalDesktopTrack: vi.fn() }));
vi.mock('./logger', () => ({ default: { info: vi.fn(), warn: vi.fn() } }));

function makeState(desktopSharingMacOSSystemAudio: boolean) {
    return { 'features/base/config': { desktopSharingMacOSSystemAudio } } as unknown as IReduxState;
}

const hostWithKey = makeState(true);
const hostWithoutKey = makeState(false);

// Imports a fresh ./functions with the given macOS version lookup result, then settles the lookup.
async function load(platformVersion?: string | Error) {
    const getHighEntropyValues = vi.fn(() => (platformVersion instanceof Error
        ? Promise.reject(platformVersion)
        : Promise.resolve({ platformVersion })));

    vi.resetModules();
    vi.stubGlobal('navigator', { userAgentData: platformVersion === undefined ? undefined : { getHighEntropyValues } });

    const functions = await import('./functions');

    // The first call starts the lookup.
    functions.isElectronSystemAudioSupported(hostWithKey);
    await settleLookup();

    return { ...functions, getHighEntropyValues };
}

function settleLookup() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

afterEach(() => {
    vi.unstubAllGlobals();
    Object.assign(env, { electron: true, electronVersion: 42, mobile: false, os: 'macos' });
});

describe('isElectronSystemAudioSupported', () => {
    it('is supported on Windows without the host flag', async () => {
        env.os = 'windows';
        env.electronVersion = 30;

        const { isElectronSystemAudioSupported, isScreenAudioSupported } = await load();

        expect(isElectronSystemAudioSupported(hostWithoutKey)).toBe(true);
        expect(isScreenAudioSupported(hostWithoutKey)).toBe(true);
    });

    it.each([
        [ '14.2.0', 39 ],
        [ '15.1.0', 42 ],
        [ '26.0.1', 43 ]
    ])('is supported on macOS %s with Electron %i', async (platformVersion, electronVersion) => {
        env.electronVersion = electronVersion;

        const { isElectronSystemAudioSupported, isScreenAudioSupported } = await load(platformVersion);

        expect(isElectronSystemAudioSupported(hostWithKey)).toBe(true);
        expect(isScreenAudioSupported(hostWithKey)).toBe(true);
    });

    it.each([
        [ '14.1.2', 42 ],
        [ '13.6.0', 42 ],
        [ '15.1.0', 38 ]
    ])('is not supported on macOS %s with Electron %i', async (platformVersion, electronVersion) => {
        env.electronVersion = electronVersion;

        const { isElectronSystemAudioSupported, isScreenAudioSupported } = await load(platformVersion);

        expect(isElectronSystemAudioSupported(hostWithKey)).toBe(false);
        expect(isScreenAudioSupported(hostWithKey)).toBe(false);
    });

    it('is not supported on macOS when the host has not declared the Info.plist key', async () => {
        const { isElectronSystemAudioSupported, isScreenAudioSupported } = await load('15.1.0');

        expect(isElectronSystemAudioSupported(hostWithoutKey)).toBe(false);
        expect(isScreenAudioSupported(hostWithoutKey)).toBe(false);
    });

    it('does not read the macOS version without the host flag', async () => {
        const getHighEntropyValues = vi.fn(() => Promise.resolve({ platformVersion: '15.1.0' }));

        vi.resetModules();
        vi.stubGlobal('navigator', { userAgentData: { getHighEntropyValues } });

        const { isElectronSystemAudioSupported } = await import('./functions');

        expect(isElectronSystemAudioSupported(hostWithoutKey)).toBe(false);
        expect(getHighEntropyValues).not.toHaveBeenCalled();
    });

    it('reads the macOS version once', async () => {
        const { isElectronSystemAudioSupported, getHighEntropyValues } = await load('15.1.0');

        isElectronSystemAudioSupported(hostWithKey);
        isElectronSystemAudioSupported(hostWithKey);

        expect(getHighEntropyValues).toHaveBeenCalledTimes(1);
    });

    it('is not supported on macOS when the version is unknown', async () => {
        expect((await load()).isElectronSystemAudioSupported(hostWithKey)).toBe(false);
        expect((await load(new Error('denied'))).isElectronSystemAudioSupported(hostWithKey)).toBe(false);
    });

    it.each([ '', 'abc', '14' ])('is not supported on macOS with the malformed version %j', async platformVersion => {
        expect((await load(platformVersion)).isElectronSystemAudioSupported(hostWithKey)).toBe(false);
    });

    it('is not supported on macOS until the version has been read', async () => {
        let resolveLookup: (value: { platformVersion: string; }) => void = () => undefined;

        vi.resetModules();
        vi.stubGlobal('navigator', {
            userAgentData: {
                getHighEntropyValues: () => new Promise(resolve => {
                    resolveLookup = resolve;
                })
            }
        });

        const { isElectronSystemAudioSupported } = await import('./functions');

        expect(isElectronSystemAudioSupported(hostWithKey)).toBe(false);

        resolveLookup({ platformVersion: '15.1.0' });
        await settleLookup();

        expect(isElectronSystemAudioSupported(hostWithKey)).toBe(true);
    });

    it('is not supported on Linux', async () => {
        env.os = 'linux';

        const { isElectronSystemAudioSupported, isScreenAudioSupported } = await load();

        expect(isElectronSystemAudioSupported(hostWithKey)).toBe(false);
        expect(isScreenAudioSupported(hostWithKey)).toBe(false);
    });

    it('leaves desktop Chromium browsers to the browser picker', async () => {
        env.electron = false;

        const { isElectronSystemAudioSupported, isScreenAudioSupported } = await load('15.1.0');

        expect(isElectronSystemAudioSupported(hostWithoutKey)).toBe(false);
        expect(isScreenAudioSupported(hostWithoutKey)).toBe(true);
    });
});

describe('isSystemAudioOfferedFor', () => {
    it('offers it with a screen only on Windows', async () => {
        env.os = 'windows';

        const { isSystemAudioOfferedFor } = await load();

        expect(isSystemAudioOfferedFor(hostWithoutKey, 'screen')).toBe(true);
        expect(isSystemAudioOfferedFor(hostWithoutKey, 'window')).toBe(false);
    });

    it('offers it with a screen and a window on a supported macOS', async () => {
        const { isSystemAudioOfferedFor } = await load('15.1.0');

        expect(isSystemAudioOfferedFor(hostWithKey, 'screen')).toBe(true);
        expect(isSystemAudioOfferedFor(hostWithKey, 'window')).toBe(true);
    });

    it('does not offer it on macOS without the host flag', async () => {
        const { isSystemAudioOfferedFor } = await load('15.1.0');

        expect(isSystemAudioOfferedFor(hostWithoutKey, 'screen')).toBe(false);
        expect(isSystemAudioOfferedFor(hostWithoutKey, 'window')).toBe(false);
    });

    it('does not offer it on an unsupported macOS', async () => {
        const { isSystemAudioOfferedFor } = await load('14.1.0');

        expect(isSystemAudioOfferedFor(hostWithKey, 'screen')).toBe(false);
        expect(isSystemAudioOfferedFor(hostWithKey, 'window')).toBe(false);
    });

    it('does not offer it on Linux', async () => {
        env.os = 'linux';

        const { isSystemAudioOfferedFor } = await load();

        expect(isSystemAudioOfferedFor(hostWithKey, 'screen')).toBe(false);
        expect(isSystemAudioOfferedFor(hostWithKey, 'window')).toBe(false);
    });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

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

// Re-imports ./functions with the given macOS client-hint version, which is read at module load.
async function load(platformVersion?: string | Error) {
    vi.resetModules();
    vi.stubGlobal('navigator', {
        userAgentData: platformVersion === undefined ? undefined : {
            getHighEntropyValues: () => (platformVersion instanceof Error
                ? Promise.reject(platformVersion)
                : Promise.resolve({ platformVersion }))
        }
    });

    const functions = await import('./functions');

    await settleLookup();

    return functions;
}

// Lets the version lookup started at module load settle.
function settleLookup() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

describe('isElectronSystemAudioSupported', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        Object.assign(env, { electron: true, electronVersion: 42, mobile: false, os: 'macos' });
    });

    it('is supported on Windows', async () => {
        env.os = 'windows';
        env.electronVersion = 30;

        const { isElectronSystemAudioSupported, isScreenAudioSupported } = await load();

        expect(isElectronSystemAudioSupported()).toBe(true);
        expect(isScreenAudioSupported()).toBe(true);
    });

    it.each([
        [ '14.2.0', 39 ],
        [ '15.1.0', 42 ],
        [ '26.0.1', 43 ]
    ])('is supported on macOS %s with Electron %i', async (platformVersion, electronVersion) => {
        env.electronVersion = electronVersion;

        const { isElectronSystemAudioSupported, isScreenAudioSupported } = await load(platformVersion);

        expect(isElectronSystemAudioSupported()).toBe(true);
        expect(isScreenAudioSupported()).toBe(true);
    });

    it.each([
        [ '14.1.2', 42 ],
        [ '13.6.0', 42 ],
        [ '15.1.0', 38 ]
    ])('is not supported on macOS %s with Electron %i', async (platformVersion, electronVersion) => {
        env.electronVersion = electronVersion;

        const { isElectronSystemAudioSupported, isScreenAudioSupported } = await load(platformVersion);

        expect(isElectronSystemAudioSupported()).toBe(false);
        expect(isScreenAudioSupported()).toBe(false);
    });

    it('is not supported on macOS when the version is unknown', async () => {
        expect((await load()).isElectronSystemAudioSupported()).toBe(false);
        expect((await load(new Error('denied'))).isElectronSystemAudioSupported()).toBe(false);
    });

    it.each([ '', 'abc', '14' ])('is not supported on macOS with the malformed version %j', async platformVersion => {
        expect((await load(platformVersion)).isElectronSystemAudioSupported()).toBe(false);
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

        expect(isElectronSystemAudioSupported()).toBe(false);

        resolveLookup({ platformVersion: '15.1.0' });
        await settleLookup();

        expect(isElectronSystemAudioSupported()).toBe(true);
    });

    it('is not supported on Linux', async () => {
        env.os = 'linux';

        const { isElectronSystemAudioSupported, isScreenAudioSupported } = await load();

        expect(isElectronSystemAudioSupported()).toBe(false);
        expect(isScreenAudioSupported()).toBe(false);
    });

    it('leaves desktop Chromium browsers to the browser picker', async () => {
        env.electron = false;

        const { isElectronSystemAudioSupported, isScreenAudioSupported } = await load('15.1.0');

        expect(isElectronSystemAudioSupported()).toBe(false);
        expect(isScreenAudioSupported()).toBe(true);
    });
});

describe('isSystemAudioOfferedFor', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        Object.assign(env, { electron: true, electronVersion: 42, mobile: false, os: 'macos' });
    });

    it('offers it with a screen only on Windows', async () => {
        env.os = 'windows';

        const { isSystemAudioOfferedFor } = await load();

        expect(isSystemAudioOfferedFor('screen')).toBe(true);
        expect(isSystemAudioOfferedFor('window')).toBe(false);
    });

    it('offers it with a screen and a window on a supported macOS', async () => {
        const { isSystemAudioOfferedFor } = await load('15.1.0');

        expect(isSystemAudioOfferedFor('screen')).toBe(true);
        expect(isSystemAudioOfferedFor('window')).toBe(true);
    });

    it('does not offer it on an unsupported macOS', async () => {
        const { isSystemAudioOfferedFor } = await load('14.1.0');

        expect(isSystemAudioOfferedFor('screen')).toBe(false);
        expect(isSystemAudioOfferedFor('window')).toBe(false);
    });

    it('does not offer it on Linux', async () => {
        env.os = 'linux';

        const { isSystemAudioOfferedFor } = await load();

        expect(isSystemAudioOfferedFor('screen')).toBe(false);
        expect(isSystemAudioOfferedFor('window')).toBe(false);
    });
});

// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getBlockedGuide, getBrowserNames, getKeySuffix } from './functions';

const mocks = vi.hoisted(() => {
    return {
        browser: {
            isChromiumBased: vi.fn(),
            isElectron: vi.fn(),
            isFirefox: vi.fn(),
            isSafari: vi.fn()
        },
        isMacOS: vi.fn(),
        isWindows: vi.fn()
    };
});

vi.mock('../base/environment/environment', () => ({ isMacOS: mocks.isMacOS, isWindows: mocks.isWindows }));
vi.mock('../base/lib-jitsi-meet', () => ({ browser: mocks.browser }));

const setUserAgent = (userAgent: string) => Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value: userAgent
});

describe('device-permissions functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.browser.isChromiumBased.mockReturnValue(true);
        mocks.browser.isElectron.mockReturnValue(false);
        mocks.browser.isFirefox.mockReturnValue(false);
        mocks.browser.isSafari.mockReturnValue(false);
        mocks.isMacOS.mockReturnValue(false);
        mocks.isWindows.mockReturnValue(false);
        setUserAgent('Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36');
        delete (navigator as any).brave;
    });

    describe('getBlockedGuide', () => {
        it('picks the OS settings for an OS block', () => {
            expect(getBlockedGuide([ 'os' ])).toBe('osOther');
            mocks.isWindows.mockReturnValue(true);
            expect(getBlockedGuide([ 'os' ])).toBe('osWindows');
            mocks.isMacOS.mockReturnValue(true);
            expect(getBlockedGuide([ 'browser', 'os' ])).toBe('osMac');
        });

        it('picks the browser\'s site settings for a browser block, whatever the OS', () => {
            mocks.isMacOS.mockReturnValue(true);
            expect(getBlockedGuide([ 'browser' ])).toBe('browserChromium');
            mocks.browser.isSafari.mockReturnValue(true);
            expect(getBlockedGuide([ 'user', undefined ])).toBe('browserSafari');
            mocks.browser.isFirefox.mockReturnValue(true);
            expect(getBlockedGuide([ 'browser' ])).toBe('browserFirefox');
        });

        it('picks no settings when the permissions policy blocks a device', () => {
            mocks.isMacOS.mockReturnValue(true);
            expect(getBlockedGuide([ 'os', 'policy' ])).toBe('policy');
        });
    });

    describe('getBrowserNames', () => {
        it('names Chrome and the Chromium browsers that look like it', () => {
            expect(getBrowserNames()).toEqual({ app: 'Google Chrome', name: 'Chrome' });

            (navigator as any).brave = {};
            expect(getBrowserNames()).toEqual({ app: 'Brave Browser', name: 'Brave' });

            setUserAgent(`${navigator.userAgent} Edg/157.0.0.0`);
            expect(getBrowserNames()).toEqual({ app: 'Microsoft Edge', name: 'Edge' });
        });

        it('names Firefox and Safari', () => {
            mocks.browser.isChromiumBased.mockReturnValue(false);
            mocks.browser.isFirefox.mockReturnValue(true);
            expect(getBrowserNames()?.name).toBe('Firefox');
            mocks.browser.isFirefox.mockReturnValue(false);
            mocks.browser.isSafari.mockReturnValue(true);
            expect(getBrowserNames()?.name).toBe('Safari');
        });

        it('names nothing it can\'t tell, e.g. an Electron app', () => {
            mocks.browser.isElectron.mockReturnValue(true);
            expect(getBrowserNames()).toBeUndefined();
        });
    });

    it('getKeySuffix names the devices', () => {
        expect(getKeySuffix([ 'audio' ])).toBe('Audio');
        expect(getKeySuffix([ 'video' ])).toBe('Video');
        expect(getKeySuffix([ 'audio', 'video' ])).toBe('Both');
    });
});

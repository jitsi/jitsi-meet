import { describe, expect, it } from 'vitest';

import {
    addHashParamsToURL,
    appendURLHashParam,
    appendURLParam,
    getBackendSafePath,
    getBackendSafeRoomName,
    getDecodedURI,
    getLocationContextRoot,
    getNormalizedRoomName,
    isImageDataURL,
    parseStandardURIString,
    parseURIString,
    safeDecodeURIComponent,
    sanitizeUrl,
    toURLString,
    urlObjectToString
} from './uri';

describe('uri utilities', () => {
    describe('parseURIString', () => {
        it('parses a standard Jitsi Meet room URL with query and hash params', () => {
            const parsed = parseURIString('https://meet.jit.si/TestRoom?jwt=abc#config.startWithAudioMuted=true');

            expect(parsed).toBeDefined();
            expect(parsed?.protocol).toBe('https:');
            expect(parsed?.host).toBe('meet.jit.si');
            expect(parsed?.hostname).toBe('meet.jit.si');
            expect(parsed?.pathname).toBe('/TestRoom');
            expect(parsed?.contextRoot).toBe('/');
            expect(parsed?.room).toBe('TestRoom');
            expect(parsed?.tenant).toBeUndefined();
            expect(parsed?.search).toBe('?jwt=abc');
            expect(parsed?.hash).toBe('#config.startWithAudioMuted=true');
        });

        it('extracts tenant and port when present', () => {
            const parsed = parseURIString('https://alpha.jitsi.net:8443/my-tenant/MyRoom');

            expect(parsed?.hostname).toBe('alpha.jitsi.net');
            expect(parsed?.port).toBe('8443');
            expect(parsed?.contextRoot).toBe('/my-tenant/');
            expect(parsed?.tenant).toBe('my-tenant');
            expect(parsed?.room).toBe('MyRoom');
        });

        it('translates custom mobile app link schemes to https', () => {
            const parsed = parseURIString('org.jitsi.meet://meet.jit.si/MobileRoom');

            expect(parsed?.protocol).toBe('https:');
            expect(parsed?.host).toBe('meet.jit.si');
            expect(parsed?.room).toBe('MobileRoom');
        });

        it('strips disallowed RFC 3986 / jxmpp characters from path segments', () => {
            const parsed = parseURIString('https://meet.jit.si/Room@Name!With$Chars');

            expect(parsed?.room).toBe('RoomNameWithChars');
        });

        it('returns undefined when input is not a string', () => {
            expect(parseURIString(undefined)).toBeUndefined();
        });
    });

    describe('parseStandardURIString', () => {
        it('strips whitespace and extracts userinfo-free host', () => {
            const parsed = parseStandardURIString('https://user@example.com:8080/path/room ?a=1#hash');

            expect(parsed.protocol).toBe('https:');
            expect(parsed.host).toBe('example.com:8080');
            expect(parsed.hostname).toBe('example.com');
            expect(parsed.port).toBe('8080');
            expect(parsed.pathname).toBe('/path/room');
            expect(parsed.search).toBe('?a=1');
            expect(parsed.hash).toBe('#hash');
        });
    });

    describe('room name and path normalization', () => {
        it('normalizes room names with NFKC and lowercasing', () => {
            expect(getNormalizedRoomName('My%20Room')).toBe('my room');
            expect(getNormalizedRoomName(undefined)).toBeUndefined();
        });

        it('produces backend-safe lowercase percent-encoded room names and paths', () => {
            expect(getBackendSafeRoomName('My Room')).toBe('my%20room');
            expect(getBackendSafeRoomName(undefined)).toBeUndefined();
            expect(getBackendSafePath('/Tenant One/Room Two')).toBe('/tenant%20one/room%20two');
            expect(getBackendSafePath(undefined)).toBeUndefined();
        });

        it('computes location context root from pathname', () => {
            expect(getLocationContextRoot({ pathname: '/tenant/room' })).toBe('/tenant/');
            expect(getLocationContextRoot({ pathname: '/room' })).toBe('/');
            expect(getLocationContextRoot({ pathname: 'room' })).toBe('/');
        });
    });

    describe('URL string & object conversions', () => {
        it('converts string, URL instance, and ExternalAPI config objects to URL strings', () => {
            expect(toURLString('https://meet.jit.si/Room')).toBe('https://meet.jit.si/Room');
            expect(toURLString(new URL('https://meet.jit.si/Room'))).toBe('https://meet.jit.si/Room');
            expect(toURLString(undefined)).toBeUndefined();

            const fromObj = urlObjectToString({
                scheme: 'https',
                domain: 'meet.jit.si',
                roomName: 'DemoRoom',
                jwt: 'secret-jwt',
                lang: 'en',
                configOverwrite: { startWithAudioMuted: true }
            });

            expect(fromObj).toContain('https://meet.jit.si/DemoRoom');
            expect(fromObj).toContain('jwt=secret-jwt');
            expect(fromObj).toContain('lang=en');
            expect(fromObj).toContain('config.startWithAudioMuted=true');
        });
    });

    describe('query & hash parameter helpers', () => {
        it('appends query parameters cleanly', () => {
            expect(appendURLParam('https://meet.jit.si/Room', 'jwt', 'abc'))
                .toBe('https://meet.jit.si/Room?jwt=abc');
            expect(appendURLParam('https://meet.jit.si/Room?a=1', 'b', '2'))
                .toBe('https://meet.jit.si/Room?a=1&b=2');
        });

        it('appends hash parameters cleanly', () => {
            expect(appendURLHashParam('https://meet.jit.si/Room', 'foo', 'bar'))
                .toBe('https://meet.jit.si/Room#foo=bar');
            expect(appendURLHashParam('https://meet.jit.si/Room#foo=bar', 'baz', 'qux'))
                .toBe('https://meet.jit.si/Room#foo=bar&baz=qux');
        });

        it('adds JSON-encoded hash params to a URL object', () => {
            const updated = addHashParamsToURL(new URL('https://meet.jit.si/Room'), {
                'config.prejoinEnabled': false
            });

            expect(updated.hash).toBe('#config.prejoinEnabled=false');
        });
    });

    describe('decoding, sanitization, and data URL checks', () => {
        it('safely decodes malformed URI components without throwing', () => {
            expect(safeDecodeURIComponent('%E0%A4%A')).toBe('%E0%A4%A');
            expect(safeDecodeURIComponent('hello%20world')).toBe('hello world');
        });

        it('decodes URI and strips http/https protocol', () => {
            expect(getDecodedURI('https://meet.jit.si/My%20Room')).toBe('meet.jit.si/My Room');
        });

        it('sanitizes unsafe URLs to null and returns URL instance for safe ones', () => {
            expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
            expect(sanitizeUrl(undefined)).toBeNull();
            expect(sanitizeUrl('https://meet.jit.si/SafeRoom')?.href).toBe('https://meet.jit.si/SafeRoom');
        });

        it('identifies valid base64 image data URLs', () => {
            expect(isImageDataURL('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
            expect(isImageDataURL('https://meet.jit.si/avatar.png')).toBe(false);
        });
    });
});

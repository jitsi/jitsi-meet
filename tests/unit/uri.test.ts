import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    APP_LINK_SCHEME,
    StatusCode,
    URI_PROTOCOL_PATTERN,
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
} from '../../react/features/base/util/uri';

describe('Base Util URI', () => {
    describe('Constants & Enums', () => {
        it('exports correct constants and status codes', () => {
            assert.equal(StatusCode.PaymentRequired, 402);
            assert.equal(APP_LINK_SCHEME, 'org.jitsi.meet:');
            assert.ok(new RegExp(URI_PROTOCOL_PATTERN, 'i').test('https:'));
            assert.ok(new RegExp(URI_PROTOCOL_PATTERN, 'i').test('org.jitsi.meet:'));
        });
    });

    describe('Room Name Normalization & Backend Safe Conversion', () => {
        it('getNormalizedRoomName decodes, normalizes NFKC, and lowercases room names', () => {
            assert.equal(getNormalizedRoomName(undefined), undefined);
            assert.equal(getNormalizedRoomName(''), '');
            assert.equal(getNormalizedRoomName('TestRoom'), 'testroom');
            assert.equal(getNormalizedRoomName('Test%20Room'), 'test room');
            assert.equal(getNormalizedRoomName('ＴｅｓｔＲｏｏｍ'), 'testroom');
            assert.equal(getNormalizedRoomName('Invalid%ZZRoom'), 'invalid%zzroom');
        });

        it('getBackendSafeRoomName converts room name to backend-safe lowercase URI encoded format', () => {
            assert.equal(getBackendSafeRoomName(undefined), undefined);
            assert.equal(getBackendSafeRoomName(''), '');
            assert.equal(getBackendSafeRoomName('My Room'), 'my%20room');
            assert.equal(getBackendSafeRoomName('Café'), 'caf%c3%a9');
            assert.equal(getBackendSafeRoomName('Tenant/Room'), 'tenant%2froom');
        });

        it('getBackendSafePath splits path by slash and converts each segment', () => {
            assert.equal(getBackendSafePath(undefined), undefined);
            assert.equal(getBackendSafePath(''), '');
            assert.equal(getBackendSafePath('mytenant/myroom'), 'mytenant/myroom');
            assert.equal(getBackendSafePath('tenant/My Room'), 'tenant/my%20room');
            assert.equal(getBackendSafePath('org/team/Project Room'), 'org/team/project%20room');
        });
    });

    describe('Context Root & Path Utilities', () => {
        it('getLocationContextRoot determines context root from pathname', () => {
            assert.equal(getLocationContextRoot({ pathname: '/' }), '/');
            assert.equal(getLocationContextRoot({ pathname: '/myroom' }), '/');
            assert.equal(getLocationContextRoot({ pathname: '/tenant/myroom' }), '/tenant/');
            assert.equal(getLocationContextRoot({ pathname: '/a/b/c/room' }), '/a/b/c/');
            assert.equal(getLocationContextRoot({ pathname: 'noroot' }), '/');
        });

        it('safeDecodeURIComponent handles valid and invalid percent sequences', () => {
            assert.equal(safeDecodeURIComponent('hello%20world'), 'hello world');
            assert.equal(safeDecodeURIComponent('plain text'), 'plain text');
            // Malformed percent encoding should not throw
            assert.equal(safeDecodeURIComponent('100% discount'), '100% discount');
        });

        it('getDecodedURI strips http/https and decodes URI components', () => {
            assert.equal(getDecodedURI('https://meet.jit.si/my%20room'), 'meet.jit.si/my room');
            assert.equal(getDecodedURI('http://localhost:8080/my%20room'), 'localhost:8080/my room');
            assert.equal(getDecodedURI('meet.jit.si/test'), 'meet.jit.si/test');
        });
    });

    describe('Image Data URL Detection', () => {
        it('isImageDataURL identifies valid base64 image data schemes', () => {
            assert.equal(isImageDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE='), true);
            assert.equal(isImageDataURL('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), true);
            assert.equal(isImageDataURL('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='), true);
            assert.equal(isImageDataURL('https://meet.jit.si/logo.png'), false);
            assert.equal(isImageDataURL('data:text/plain;base64,SGVsbG8='), false);
            assert.equal(isImageDataURL('invalid-url'), false);
        });
    });

    describe('URI Parsing (Standard and Jitsi Specific)', () => {
        it('parseStandardURIString parses authority, pathname, search, and hash', () => {
            const uri = 'https://user:pass@meet.jit.si:8443/custom/path?query=1&audio=off#hashval';
            const parsed = parseStandardURIString(uri);

            assert.equal(parsed.protocol, 'https:');
            assert.equal(parsed.hostname, 'meet.jit.si');
            assert.equal(parsed.port, '8443');
            assert.equal(parsed.host, 'meet.jit.si:8443');
            assert.equal(parsed.pathname, '/custom/path');
            assert.equal(parsed.search, '?query=1&audio=off');
            assert.equal(parsed.hash, '#hashval');
            assert.equal(parsed.toString(), 'https://meet.jit.si:8443/custom/path?query=1&audio=off#hashval');
        });

        it('parseStandardURIString strips whitespace from URI strings', () => {
            const uri = '  https://meet.jit.si/room  ';
            const parsed = parseStandardURIString(uri);

            assert.equal(parsed.protocol, 'https:');
            assert.equal(parsed.hostname, 'meet.jit.si');
            assert.equal(parsed.pathname, '/room');
        });

        it('parseURIString parses Jitsi resource URI and cleans illegal characters', () => {
            assert.equal(parseURIString(undefined), undefined);
            assert.equal(parseURIString(null as any), undefined);

            const result = parseURIString('https://meet.jit.si/my:room!name?');
            assert.equal(result.protocol, 'https:');
            assert.equal(result.hostname, 'meet.jit.si');
            // Illegal characters (: ! ?) are excluded from room name
            assert.equal(result.room, 'myroomname');
            assert.equal(result.tenant, undefined);
        });

        it('parseURIString extracts tenant from multi-segment paths', () => {
            const result = parseURIString('https://meet.jit.si/vpaas-magic-cookie/daily-standup');
            assert.equal(result.tenant, 'vpaas-magic-cookie');
            assert.equal(result.room, 'daily-standup');
            assert.equal(result.contextRoot, '/vpaas-magic-cookie/');
        });

        it('parseURIString replaces app link scheme with https', () => {
            const result = parseURIString('org.jitsi.meet://meet.jit.si/app-room');
            assert.equal(result.protocol, 'https:');
            assert.equal(result.hostname, 'meet.jit.si');
            assert.equal(result.room, 'app-room');
        });
    });

    describe('URL Object Conversion & Serialization', () => {
        it('toURLString handles string, URL instance, and object', () => {
            assert.equal(toURLString(undefined), undefined);
            assert.equal(toURLString('https://meet.jit.si/test'), 'https://meet.jit.si/test');

            const urlObj = new URL('https://meet.jit.si/url-obj');
            assert.equal(toURLString(urlObj), 'https://meet.jit.si/url-obj');

            const obj = { serverURL: 'https://meet.jit.si', room: 'obj-room' };
            assert.equal(toURLString(obj), 'https://meet.jit.si/obj-room');
        });

        it('urlObjectToString combines serverURL and room', () => {
            const result = urlObjectToString({
                serverURL: 'https://meet.jit.si',
                room: 'TeamSync'
            });
            assert.equal(result, 'https://meet.jit.si/TeamSync');
        });

        it('urlObjectToString supports domain and roomName options', () => {
            const withProtocol = urlObjectToString({
                domain: 'meet.jit.si',
                roomName: 'Conference123',
                protocol: 'https'
            });
            assert.equal(withProtocol, 'https://meet.jit.si/Conference123');

            const protocolRelative = urlObjectToString({
                domain: 'meet.jit.si',
                roomName: 'Conference123'
            });
            assert.equal(protocolRelative, '//meet.jit.si/Conference123');
        });

        it('urlObjectToString embeds jwt in search and hash', () => {
            const result = urlObjectToString({
                serverURL: 'https://meet.jit.si',
                room: 'SecureRoom',
                jwt: 'sample-jwt-token'
            });

            assert.ok(result?.includes('jwt=sample-jwt-token'));
            assert.ok(result?.includes('#jwt=%22sample-jwt-token%22') || result?.includes('#jwt="sample-jwt-token"'));
        });

        it('urlObjectToString encodes configOverwrite parameters into hash', () => {
            const result = urlObjectToString({
                serverURL: 'https://meet.jit.si',
                room: 'ConfiguredRoom',
                configOverwrite: {
                    startWithAudioMuted: true,
                    resolution: 720
                }
            });

            assert.ok(result?.includes('#config.startWithAudioMuted=true'));
            assert.ok(result?.includes('config.resolution=720'));
        });
    });

    describe('Hash & Search Parameter Manipulation', () => {
        it('addHashParamsToURL appends parameters to existing URL hash', () => {
            const url = new URL('https://meet.jit.si/room#existingParam=1');
            const updated = addHashParamsToURL(url, { newParam: 2 });

            assert.ok(updated.hash.includes('existingParam=1'));
            assert.ok(updated.hash.includes('newParam=2'));
        });

        it('appendURLParam appends search parameter properly', () => {
            const base = 'https://meet.jit.si/room';
            const updated = appendURLParam(base, 'lang', 'fr');
            assert.equal(updated, 'https://meet.jit.si/room?lang=fr');

            const second = appendURLParam(updated, 'view', 'grid');
            assert.equal(second, 'https://meet.jit.si/room?lang=fr&view=grid');
        });

        it('appendURLHashParam modifies or appends hash parameters', () => {
            const base = 'https://meet.jit.si/room#config.p2p.enabled=true';
            const updated = appendURLHashParam(base, 'config.startWithVideoMuted', 'true');

            assert.ok(updated.includes('config.p2p.enabled=true'));
            assert.ok(updated.includes('config.startWithVideoMuted=true'));
        });
    });

    describe('URL Sanitization', () => {
        it('sanitizeUrl allows safe https URLs and returns URL instance', () => {
            const sanitized = sanitizeUrl('https://meet.jit.si/safe-room');
            assert.ok(sanitized instanceof URL);
            assert.equal(sanitized?.href, 'https://meet.jit.si/safe-room');
        });

        it('sanitizeUrl blocks javascript: URLs and returns null', () => {
            assert.equal(sanitizeUrl('javascript:alert(document.cookie)'), null);
            assert.equal(sanitizeUrl('JAVASCRIPT:void(0)'), null);
        });

        it('sanitizeUrl returns null for falsy inputs', () => {
            assert.equal(sanitizeUrl(undefined), null);
            assert.equal(sanitizeUrl(''), null);
        });
    });
});

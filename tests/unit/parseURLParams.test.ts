import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseURLParams } from '../../react/features/base/util/parseURLParams';

describe('Base Util parseURLParams', () => {
    describe('Hash Parameters (Default)', () => {
        it('parses boolean and number values from hash', () => {
            const url = 'https://meet.jit.si/room#config.startWithAudioMuted=true&config.resolution=720';
            const params = parseURLParams(url);

            assert.equal(params['config.startWithAudioMuted'], true);
            assert.equal(params['config.resolution'], 720);
        });

        it('parses JSON string values properly', () => {
            const url = 'https://meet.jit.si/room#config.channelLastN=4&interfaceConfig.APP_NAME="Jitsi%20Meet"';
            const params = parseURLParams(url);

            assert.equal(params['config.channelLastN'], 4);
            assert.equal(params['interfaceConfig.APP_NAME'], 'Jitsi Meet');
        });

        it('ignores hash routes used by hash routers', () => {
            const url = 'https://meet.jit.si/#/settings';
            const params = parseURLParams(url);

            assert.deepEqual(params, {});
        });

        it('works when passed a URL object directly', () => {
            const url = new URL('https://meet.jit.si/room#config.disableDeepLinking=true');
            const params = parseURLParams(url);

            assert.equal(params['config.disableDeepLinking'], true);
        });
    });

    describe('Search Parameters', () => {
        it('parses query string parameters when source is search', () => {
            const url = 'https://meet.jit.si/room?lang=es&release=123';
            const params = parseURLParams(url, true, 'search');

            assert.equal(params.lang, 'es');
            assert.equal(params.release, '123');
        });
    });

    describe('Security & Prototype Pollution Prevention', () => {
        it('ignores blacklisted prototype pollution keys', () => {
            const maliciousUrl = 'https://meet.jit.si/room#__proto__.polluted=true&constructor.prototype.bad=true';
            const params = parseURLParams(maliciousUrl);

            assert.equal(params['__proto__.polluted'], undefined);
            assert.equal(params['constructor.prototype.bad'], undefined);
            assert.equal((Object.prototype as any).polluted, undefined);
        });
    });

    describe('Edge Cases', () => {
        it('returns empty object for empty or falsy inputs', () => {
            assert.deepEqual(parseURLParams(''), {});
            assert.deepEqual(parseURLParams(undefined as any), {});
        });

        it('handles dontParse flag to preserve raw string values', () => {
            const url = 'https://meet.jit.si/room#config.setting=true';
            const params = parseURLParams(url, true);

            assert.equal(params['config.setting'], 'true');
        });
    });
});

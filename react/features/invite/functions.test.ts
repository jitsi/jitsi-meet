import { describe, expect, it, vi } from 'vitest';

import { MAX_SIP_ADDRESS_LENGTH, SIP_ADDRESS_REGEX } from './constants';
import { isASipAddress } from './functions';

// functions.ts pulls in most of the app. Only isASipAddress is under test.
vi.mock('@jitsi/js-utils', () => ({ jitsiLocalStorage: {} }));
vi.mock('../base/conference/functions', () => ({}));
vi.mock('../base/connection/functions', () => ({}));
vi.mock('../base/environment/utils', () => ({}));
vi.mock('../base/i18n/i18next', () => ({ default: {} }));
vi.mock('../base/jwt/constants', () => ({}));
vi.mock('../base/jwt/functions', () => ({}));
vi.mock('../base/lib-jitsi-meet', () => ({}));
vi.mock('../base/participants/functions', () => ({}));
vi.mock('../base/redux/functions', () => ({}));
vi.mock('../base/util/httpUtils', () => ({}));
vi.mock('../base/util/parseURLParams', () => ({}));
vi.mock('../base/util/uri', () => ({}));
vi.mock('../jaas/functions', () => ({}));
vi.mock('../recording/functions', () => ({}));
vi.mock('./_utils', () => ({}));
vi.mock('./logger', () => ({ default: {} }));

const median = (values: number[]) => values.slice().sort((a, b) => a - b)[values.length >> 1];

/**
 * Median over a few samples of the mean time of one call. Each sample repeats the call until at least 2 ms have
 * passed, so a call that returns at once is not measured below the timer's resolution.
 */
const timePerCall = (fn: () => unknown, samples = 5) => median(Array.from({ length: samples }, () => {
    let calls = 0;
    const start = process.hrtime.bigint();
    let elapsed = 0n;

    do {
        fn();
        calls++;
        elapsed = process.hrtime.bigint() - start;
    } while (elapsed < 2_000_000n);

    return Number(elapsed) / calls;
}));

describe('isASipAddress', () => {
    it.each([
        'sip:user@host.com',
        'user@host.com',
        'user@host',
        'host.example.com',
        '+1234567@sip.example.com:5060;transport=tcp',
        'sip:alice:secret@example.com:5060;transport=tcp?subject=hi&priority=urgent'
    ])('accepts %s', text => {
        expect(isASipAddress(text)).toBe(true);
    });

    it.each([
        '',
        ' ',
        'user@',
        '@host.com',
        'not a sip address',
        'user@host:port',
        'sip:user@host.com extra',
        'a',
        'a!'
    ])('rejects %j', text => {
        expect(isASipAddress(text)).toBe(false);
    });

    it('gives the same answer as the regex for every short string over a small alphabet', () => {
        const alphabet = [ 'a', '+', '@', ':', ';', '.', '=', '?', ' ', '-' ];
        let count = 0;

        const walk = (prefix: string, depth: number) => {
            for (const ch of alphabet) {
                const text = prefix + ch;

                count++;
                if (isASipAddress(text) !== SIP_ADDRESS_REGEX.test(text)) {
                    throw new Error(`isASipAddress differs from the regex on ${JSON.stringify(text)}`);
                }
                if (depth > 1) {
                    walk(text, depth - 1);
                }
            }
        };

        walk('', 5);
        expect(count).toBe(111110);
    });

    it('gives the same answer as the regex up to the length limit', () => {
        for (const text of [ 'a'.repeat(MAX_SIP_ADDRESS_LENGTH), `${'a'.repeat(MAX_SIP_ADDRESS_LENGTH - 1)}!` ]) {
            expect(isASipAddress(text)).toBe(SIP_ADDRESS_REGEX.test(text));
        }
    });

    it('rejects text longer than the limit', () => {
        expect(isASipAddress('a'.repeat(MAX_SIP_ADDRESS_LENGTH + 1))).toBe(false);
    });

    // The ratio of the 4N run to the N run is about 4 for linear work and about 16 for quadratic work.
    it.each([
        [ 'ends in a character the regex cannot take', (n: number) => `${'a'.repeat(n)}!` ],
        [ 'ends in a space and a word', (n: number) => `${'a'.repeat(n)} x` ],
        [ 'has an @ in the middle', (n: number) => `${'a'.repeat(n / 2)}@${'a'.repeat(n / 2)}!` ]
    ])('does not slow down quadratically on input that %s', (_name, make) => {
        const small = make(2000);
        const large = make(8000);

        expect(isASipAddress(large)).toBe(false);

        const ratio = timePerCall(() => isASipAddress(large)) / timePerCall(() => isASipAddress(small));

        expect(ratio).toBeLessThan(8);
    });
});

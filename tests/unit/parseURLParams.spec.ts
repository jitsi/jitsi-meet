import { strict as assert } from 'node:assert';

import { parseURLParams } from '../../react/features/base/util/parseURLParams';

describe('parseURLParams', () => {
    for (const source of [ 'search', 'hash' ]) {
        const prefix = source === 'search' ? '?' : '#';

        it(`preserves equals signs in raw ${source} values`, () => {
            const url = `https://example.com/room${prefix}token=abc==&name=a=b&empty=`;

            assert.deepEqual(parseURLParams(url, true, source), {
                token: 'abc==',
                name: 'a=b',
                empty: ''
            });
        });

        it(`preserves equals signs in JSON ${source} values`, () => {
            const url = `https://example.com/room${prefix}config.defaultLocalDisplayName=%22a=b%22`;

            assert.deepEqual(parseURLParams(url, false, source), {
                'config.defaultLocalDisplayName': 'a=b'
            });
        });

        it(`keeps percent-encoded equals signs working in ${source} values`, () => {
            const url = `https://example.com/room${prefix}config.defaultLocalDisplayName=%22a%3Db%22`;

            assert.deepEqual(parseURLParams(url, false, source), {
                'config.defaultLocalDisplayName': 'a=b'
            });
        });
    }
});

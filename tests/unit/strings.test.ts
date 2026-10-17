import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import * as stringsWeb from '../../react/features/base/util/strings.web';
import * as stringsNative from '../../react/features/base/util/strings.native';

describe('Base Util Strings (Web & Native)', () => {
    describe('Web Implementation (strings.web.ts)', () => {
        it('normalizes NFKC unicode characters', () => {
            // Fullwidth to ASCII
            assert.equal(stringsWeb.normalizeNFKC('ＡＢＣ'), 'ABC');
            // Compatibility ligatures
            assert.equal(stringsWeb.normalizeNFKC('ﬁ'), 'fi');
            // Superscript numbers
            assert.equal(stringsWeb.normalizeNFKC('¹²³'), '123');
            // Regular strings remain unchanged
            assert.equal(stringsWeb.normalizeNFKC('regular text'), 'regular text');
        });

        it('normalizes accents and removes diacritics', () => {
            assert.equal(stringsWeb.normalizeAccents('café'), 'cafe');
            assert.equal(stringsWeb.normalizeAccents('résumé'), 'resume');
            assert.equal(stringsWeb.normalizeAccents('München'), 'Munchen');
            assert.equal(stringsWeb.normalizeAccents('façade'), 'facade');
            assert.equal(stringsWeb.normalizeAccents('español'), 'espanol');
            assert.equal(stringsWeb.normalizeAccents('plain text'), 'plain text');
        });
    });

    describe('Native Implementation (strings.native.ts)', () => {
        it('normalizes NFKC unicode characters via unorm', () => {
            assert.equal(stringsNative.normalizeNFKC('ＡＢＣ'), 'ABC');
            assert.equal(stringsNative.normalizeNFKC('ﬁ'), 'fi');
            assert.equal(stringsNative.normalizeNFKC('¹²³'), '123');
            assert.equal(stringsNative.normalizeNFKC('regular text'), 'regular text');
        });

        it('normalizes accents and removes diacritics via unorm', () => {
            assert.equal(stringsNative.normalizeAccents('café'), 'cafe');
            assert.equal(stringsNative.normalizeAccents('résumé'), 'resume');
            assert.equal(stringsNative.normalizeAccents('München'), 'Munchen');
            assert.equal(stringsNative.normalizeAccents('façade'), 'facade');
            assert.equal(stringsNative.normalizeAccents('español'), 'espanol');
            assert.equal(stringsNative.normalizeAccents('plain text'), 'plain text');
        });
    });
});

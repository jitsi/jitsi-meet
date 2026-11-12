import i18next from 'i18next';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Trans } from 'react-i18next';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { REACT_I18NEXT_OPTIONS } from './constants';
import { createTranslationLineBreak, createTranslationLink } from './functions.web';

vi.mock('./functions.any', () => {
    return {};
});
vi.mock('./languageDetector', () => {
    return { default: {} };
});

// An instance with the options the app gives to react-i18next and to the interpolation.
const i18n = i18next.createInstance();

const LINK = '<a href="https://example.com/a?b=c" rel="noopener noreferrer" target="_blank">';

/**
 * Renders a translation with Trans, as the app does, and returns the resulting HTML.
 *
 * @param {string} translation - The translated text, as a language bundle would provide it.
 * @param {Record<string, unknown>} values - The interpolation values, if any.
 * @returns {string}
 */
function render(translation: string, values?: Record<string, unknown>) {
    i18n.addResourceBundle('en', 'main', { test: { key: translation } }, true, true);

    return renderToStaticMarkup(
        <Trans
            components = { [ createTranslationLink('https://example.com/a?b=c'), createTranslationLineBreak() ] }
            i18n = { i18n }
            i18nKey = 'test.key'
            values = { values } />
    );
}

describe('createTranslationLink', () => {
    it('creates a link which opens in a new browsing context', () => {
        expect(renderToStaticMarkup(createTranslationLink('https://example.com/a?b=c'))).toBe(`${LINK}</a>`);
    });

    it('does not create a link when the URL is not http(s)', () => {
        // eslint-disable-next-line no-script-url
        for (const url of [ 'javascript:alert(1)', 'data:text/html,x', '//example.com', '/static/page.html', '' ]) {
            expect(renderToStaticMarkup(createTranslationLink(url))).toBe('<span></span>');
        }

        expect(renderToStaticMarkup(createTranslationLink())).toBe('<span></span>');
    });
});

describe('translations rendered with Trans', () => {
    beforeAll(async () => {
        await i18n.init({
            defaultNS: 'main',
            interpolation: {
                escapeValue: false
            },
            lng: 'en',
            react: REACT_I18NEXT_OPTIONS,
            resources: {}
        });
    });

    it('maps the index tags to the components the code gives', () => {
        expect(render('Read <0>this</0>.<1/>Bye.')).toBe(`Read ${LINK}this</a>.<br/>Bye.`);
    });

    it('does not create elements for the tags in a translation', () => {
        const html = render('a <style>body{display:none}</style> <img src="x" onerror="alert(1)">'
            + ' <script>alert(1)</script> <b>b</b> <i>c</i> <br /> d');

        expect(html).not.toContain('<');
    });

    it('ignores the attributes a translation sets', () => {
        const html = render('<a href="https://evil.example" target="_self" onclick="alert(1)"'
            + ' data-i18n="[html]x" aria-label="y">here</a> <0 href="https://evil.example" onclick="alert(1)">there</0>');

        expect(html).toBe(`here ${LINK}there</a>`);
    });

    it('does not create elements for the tags in the interpolation values', () => {
        const html = render('Hello {{name}}!', { name: '<img src="x" onerror="alert(1)"><b>bold</b>' });

        expect(html).toBe('Hello bold!');
    });

    it('does not break on text in the tag of a line break', () => {
        expect(render('One.<1>oops</1>Two.')).toBe('One.<br/>Two.');
    });

    it('does not break on malformed markup', () => {
        const translations = [
            'a </0> b <0> c',
            'a <0>b',
            'a <5>b</5> c',
            'a <0><0>b</0></0> c',
            'a < b > c <',
            'a <a href=\'x\' target=\'_blank\'/a> b </a > c',
            '<1x>y</1x> <a:b c>x</a:b>'
        ];

        for (const translation of translations) {
            // Only the elements the code gives can be in the result.
            expect(render(translation)).not.toMatch(/<(?!\/?(a|br)\b)/);
        }
    });
});

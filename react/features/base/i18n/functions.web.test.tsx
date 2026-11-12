import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import TranslationWithMarkup from './components/web/TranslationWithMarkup';
import { REACT_I18NEXT_OPTIONS } from './constants';
import { createTranslationLineBreak, createTranslationLink } from './functions.web';
import i18n from './i18next';

vi.mock('./functions.any', () => {
    return {};
});
vi.mock('./languageDetector', () => {
    return { default: {} };
});

// The instance of the app needs the globals of the app. The test gives this one the same options for react-i18next
// and for the interpolation.
vi.mock('./i18next', async () => {
    const { default: i18next } = await import('i18next');

    return { default: i18next.createInstance() };
});

const LINK = '<a href="https://example.com/a?b=c" rel="noopener noreferrer" target="_blank">';

/**
 * Renders a translation as the app does, and returns the resulting HTML.
 *
 * @param {string} translation - The translated text, as a language bundle would provide it.
 * @param {Object} values - The interpolation values, if any.
 * @returns {string}
 */
function render(translation: string, values?: { [name: string]: number | string | undefined; }) {
    i18n.addResourceBundle('en', 'main', { test: { key: translation } }, true, true);

    return renderToStaticMarkup(
        <TranslationWithMarkup
            components = { [ createTranslationLink('https://example.com/a?b=c'), createTranslationLineBreak() ] }
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

describe('TranslationWithMarkup', () => {
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

    it('renders the interpolation values as text', () => {
        const html = render('Hello {{name}}!', { name: '<img src="x" onerror="alert(1)"><b>bold</b>' });

        expect(html).toBe('Hello &lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;&lt;b&gt;bold&lt;/b&gt;!');
    });

    it('keeps the text and the elements which follow a value with markup characters', () => {
        for (const [ value, text ] of [
            [ 'A < B', 'A &lt; B' ],
            [ 'A <x> B', 'A &lt;x&gt; B' ],
            [ 'Use <b>x', 'Use &lt;b&gt;x' ],
            [ '<0>x</0>', '&lt;0&gt;x&lt;/0&gt;' ],
            [ 'A & B > C', 'A &amp; B &gt; C' ]
        ]) {
            expect(render('Open {{app}} now.<1/><1/>Or read <0>this</0>.', { app: value }))
                .toBe(`Open ${text} now.<br/><br/>Or read ${LINK}this</a>.`);
        }
    });

    it('keeps a value which is in an index tag', () => {
        expect(render('Read <0>about {{topic}}</0>.<1/>Bye.', { topic: 'a < b' }))
            .toBe(`Read ${LINK}about a &lt; b</a>.<br/>Bye.`);
    });

    it('renders the values which are not strings', () => {
        expect(render('Wait {{timeout}} minutes for {{name}}.', { name: undefined,
            timeout: 5 })).toBe('Wait 5 minutes for .');
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

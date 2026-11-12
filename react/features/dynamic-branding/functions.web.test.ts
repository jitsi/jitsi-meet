// @vitest-environment jsdom

import DOMPurify from 'dompurify';
import { describe, expect, it } from 'vitest';

import { cleanSvg } from './functions.web';

describe('cleanSvg', () => {
    it('runs with a working sanitizer', () => {
        // DOMPurify returns its input untouched when the DOM it runs on is not good enough. The tests below would
        // then test nothing.
        expect(DOMPurify.isSupported).toBe(true);
    });

    it('keeps a plain icon', () => {
        const svg = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"></path></svg>';

        expect(cleanSvg(svg)).toBe(svg);
    });

    it('removes scripts and event handlers', () => {
        const svg = cleanSvg('<svg onload="alert(1)"><script>alert(1)</script><path d="M0 0h24v24H0z"></path></svg>');

        expect(svg).not.toContain('script');
        expect(svg).not.toContain('onload');
    });

    it('removes data-* attributes', () => {
        const svg = cleanSvg('<svg data-i18n="[onclick]alert(1)" data-i18n-options=\'{"a":"b"}\'>'
            + '<path data-x="y" d="M0 0h24v24H0z"></path></svg>');

        expect(svg).not.toContain('data-');
        expect(svg).toContain('<path d="M0 0h24v24H0z"></path>');
    });
});

import { describe, expect, it } from 'vitest';

declare global {
    // The name is the one of the standard interface this adds to.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface ImportMeta {

        // Provided by Vite, which runs the tests.
        glob: <T>(pattern: string, options: { eager: true; import: 'default'; }) => Record<string, T>;
    }
}

type Bundle = { [key: string]: Bundle | string; };

const BUNDLES = import.meta.glob<Bundle>('../../../../lang/main*.json', {
    eager: true,
    import: 'default'
});

/**
 * Collects the translations of a language bundle which contain a tag with attributes.
 *
 * @param {Bundle} bundle - The language bundle, or a part of it.
 * @param {string} path - The key of that part.
 * @returns {string[]} The keys of the translations.
 */
function findTagsWithAttributes(bundle: Bundle, path = ''): string[] {
    return Object.entries(bundle).flatMap(([ key, value ]) => {
        const keyPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string') {
            return /<[^>]*=[^>]*>/.test(value) ? [ keyPath ] : [];
        }

        return findTagsWithAttributes(value, keyPath);
    });
}

describe('language bundles', () => {
    const files = Object.keys(BUNDLES);

    it('are found', () => {
        expect(files.length).toBeGreaterThan(1);
    });

    // A translation says where a link or a line break goes with an index tag, like <0>this</0>, and the code gives the
    // element. A tag with attributes means that a translation tries to provide the element itself.
    it.each(files)('%s has no tags with attributes', (file: string) => {
        expect(findTagsWithAttributes(BUNDLES[file])).toEqual([]);
    });
});

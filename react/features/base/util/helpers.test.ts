import { assignIfDefined, escapeRegexp, setColorAlpha, objectSort } from './helpers';

describe('helpers', () => {
    describe('assignIfDefined', () => {
        it('assigns only defined values from source to target', () => {
            const target = { a: 1, b: 2 };
            const source = { b: undefined, c: 3 };
            
            const result = assignIfDefined(target, source);
            expect(result).toEqual({ a: 1, b: 2, c: 3 });
        });

        it('does not mutate target if source is empty', () => {
            const target = { a: 1 };
            const result = assignIfDefined(target, {});
            expect(result).toEqual({ a: 1 });
        });
    });

    describe('escapeRegexp', () => {
        it('escapes regex special characters', () => {
            const result = escapeRegexp('-[]/{}()*+?.\\^$|');
            expect(result).toBe('\\-\\[\\]/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|');
        });

        it('throws an error if input is not a string', () => {
            // @ts-ignore
            expect(() => escapeRegexp(123)).toThrow(TypeError);
        });
    });

    describe('setColorAlpha', () => {
        it('adds alpha to hex color', () => {
            expect(setColorAlpha('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
        });

        it('adds alpha to shorthand hex color', () => {
            expect(setColorAlpha('#f00', 0.8)).toBe('rgba(255, 0, 0, 0.8)');
        });

        it('adds alpha to rgb color', () => {
            expect(setColorAlpha('rgb(0, 255, 0)', 0.1)).toBe('rgba(0, 255, 0, 0.1)');
        });

        it('returns default fallback when color is undefined', () => {
            expect(setColorAlpha('', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
        });

        it('returns the same string if format is not supported', () => {
            expect(setColorAlpha('red', 0.5)).toBe('red');
        });
    });

    describe('objectSort', () => {
        it('sorts an object based on its values using a callback', () => {
            const obj = {
                b: { order: 2 },
                a: { order: 1 },
                c: { order: 3 }
            };
            
            const result = objectSort(obj, (a: any, b: any) => a.order - b.order);
            
            // Note: Object keys in JS retain insertion order for string keys.
            expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
        });
    });
});

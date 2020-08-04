import { limitLastN, validateLastNLimits } from './functions';

describe('limitLastN', () => {
    it('handles undefined mapping', () => {
        expect(limitLastN(0, undefined)).toBe(undefined);
    });
    describe('when a correct limit mapping is given', () => {
        const limits = new Map();

        limits.set(5, -1);
        limits.set(10, 8);
        limits.set(20, 5);

        it('returns undefined when less participants that the first limit', () => {
            expect(limitLastN(2, limits)).toBe(undefined);
        });
        it('picks the first limit correctly', () => {
            expect(limitLastN(5, limits)).toBe(-1);
            expect(limitLastN(9, limits)).toBe(-1);
        });
        it('picks the middle limit correctly', () => {
            expect(limitLastN(10, limits)).toBe(8);
            expect(limitLastN(13, limits)).toBe(8);
            expect(limitLastN(19, limits)).toBe(8);
        });
        it('picks the top limit correctly', () => {
            expect(limitLastN(20, limits)).toBe(5);
            expect(limitLastN(23, limits)).toBe(5);
            expect(limitLastN(100, limits)).toBe(5);
        });
    });
});

describe('validateLastNLimits', () => {
    describe('validates the input by returning undefined', () => {
        it('if lastNLimits param is not an Object', () => {
            expect(validateLastNLimits(5)).toBe(undefined);
        });
        it('if any key is not a number', () => {
            const limits = {
                'abc': 8,
                5: -1,
                20: 5
            };

            expect(validateLastNLimits(limits)).toBe(undefined);
        });
        it('if any value is not a number', () => {
            const limits = {
                8: 'something',
                5: -1,
                20: 5
            };

            expect(validateLastNLimits(limits)).toBe(undefined);
        });
        it('if any value is null', () => {
            const limits = {
                1: 1,
                5: null,
                20: 5
            };

            expect(validateLastNLimits(limits)).toBe(undefined);
        });
        it('if any value is undefined', () => {
            const limits = {
                1: 1,
                5: undefined,
                20: 5
            };

            expect(validateLastNLimits(limits)).toBe(undefined);
        });
        it('if the map is empty', () => {
            expect(validateLastNLimits({})).toBe(undefined);
        });
    });
    it('sorts by the keys', () => {
        const mappingKeys = validateLastNLimits({
            10: 5,
            3: 3,
            5: 4
        }).keys();

        expect(mappingKeys.next().value).toBe(3);
        expect(mappingKeys.next().value).toBe(5);
        expect(mappingKeys.next().value).toBe(10);
        expect(mappingKeys.next().done).toBe(true);
    });
    it('converts keys and values to numbers', () => {
        const mapping = validateLastNLimits({
            3: 3,
            5: 4,
            10: 5
        });

        for (const key of mapping.keys()) {
            expect(typeof key).toBe('number');
            expect(typeof mapping.get(key)).toBe('number');
        }
    });
});

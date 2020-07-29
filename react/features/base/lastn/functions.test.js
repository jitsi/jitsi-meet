import { limitLastN } from './functions';

describe('limitsLastN', () => {
    describe('when a correct limit mapping is given', () => {
        const limits = {
            5: -1,
            10: 8,
            20: 5
        };

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
    describe('validates the input by returning undefined', () => {
        it('if lastNLimits param is not an Object', () => {
            expect(limitLastN(1, 5)).toBe(undefined);
        });
        it('if any key is not a number', () => {
            const limits = {
                'abc': 8,
                5: -1,
                20: 5
            };

            expect(limitLastN(1, limits)).toBe(undefined);
            expect(limitLastN(21, limits)).toBe(undefined);
        });
        it('if any value is null', () => {
            const limits = {
                1: 1,
                5: null,
                20: 5
            };

            expect(limitLastN(21, limits)).toBe(undefined);
        });
        it('if any value is undefined', () => {
            const limits = {
                1: 1,
                5: undefined,
                20: 5
            };

            expect(limitLastN(21, limits)).toBe(undefined);
        });
        it('if the map is empty', () => {
            expect(limitLastN(10, {})).toBe(undefined);
        });
    });
    it('handles the case when keys are not ordered', () => {
        const limits = {
            10: 8,
            5: -1,
            20: 5
        };

        expect(limitLastN(1, limits)).toBe(undefined);
        expect(limitLastN(6, limits)).toBe(-1);
        expect(limitLastN(11, limits)).toBe(8);
        expect(limitLastN(21, limits)).toBe(5);
    });
});

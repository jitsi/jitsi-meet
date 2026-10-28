import { greatestCommonDivisor, leastCommonMultiple } from './math';

describe('math utilities', () => {
    describe('greatestCommonDivisor', () => {
        it('calculates the GCD of two positive numbers', () => {
            expect(greatestCommonDivisor(48, 18)).toBe(6);
            expect(greatestCommonDivisor(54, 24)).toBe(6);
            expect(greatestCommonDivisor(7, 3)).toBe(1);
        });

        it('calculates the GCD when one number is a multiple of the other', () => {
            expect(greatestCommonDivisor(20, 5)).toBe(5);
            expect(greatestCommonDivisor(100, 10)).toBe(10);
        });
    });

    describe('leastCommonMultiple', () => {
        it('calculates the LCM of two positive numbers', () => {
            expect(leastCommonMultiple(4, 6)).toBe(12);
            expect(leastCommonMultiple(21, 6)).toBe(42);
        });

        it('calculates the LCM when one number is a multiple of the other', () => {
            expect(leastCommonMultiple(20, 5)).toBe(20);
            expect(leastCommonMultiple(100, 10)).toBe(100);
        });
    });
});

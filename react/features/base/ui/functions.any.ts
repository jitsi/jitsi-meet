// Base font size in pixels (standard is 16px = 1rem)
const BASE_FONT_SIZE = 16;

/**
 * Converts rem to pixels.
 *
 * @param {string} remValue - The value in rem units (e.g. '0.875rem').
 * @returns {number}
 */
export function remToPixels(remValue: string): number {
    const numericValue = parseFloat(remValue.replace('rem', ''));

    return Math.round(numericValue * BASE_FONT_SIZE);
}

/**
 * A short string to represent the number of visitors.
 * Over 100 we show numbers like 0.2 K or 9.5 K.
 *
 * @param {number} visitorsCount - The number of visitors to shorten.
 *
 * @returns {string} Short string representing the number of visitors.
 */
export function getVisitorsShortText(visitorsCount: number) {
    return visitorsCount > 100 ? `${Math.round(visitorsCount / 100) / 10} K` : String(visitorsCount);
}

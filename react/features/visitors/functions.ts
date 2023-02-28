import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';

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

/**
 * Whether current UI is in visitor mode.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {boolean} Whether iAmVisitor is set.
 */
export function iAmVisitor(stateful: IStateful) {
    return toState(stateful)['features/visitors'].iAmVisitor;
}

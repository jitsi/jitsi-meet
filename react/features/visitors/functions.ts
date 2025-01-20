import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';

/**
 * A short string to represent the number of visitors.
 * Over 1000 we show numbers like 1.0 K or 9.5 K.
 *
 * @param {number} visitorsCount - The number of visitors to shorten.
 *
 * @returns {string} Short string representing the number of visitors.
 */
export function getVisitorsShortText(visitorsCount: number) {
    return visitorsCount >= 1000 ? `${Math.round(visitorsCount / 100) / 10} K` : String(visitorsCount);
}

/**
 * Selector to return a list of promotion requests from visitors.
 *
 * @param {IReduxState} state - State object.
 * @returns {Array<Object>}
 */
export function getPromotionRequests(state: IReduxState) {
    return state['features/visitors'].promotionRequests;
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

/**
 * Returns the number of visitors.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {number} - The number of visitors.
 */
export function getVisitorsCount(stateful: IStateful) {
    return toState(stateful)['features/visitors'].count ?? 0;
}

/**
 * Returns the number of visitors that are waiting in queue.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {number} - The number of visitors in queue.
 */
export function getVisitorsInQueueCount(stateful: IStateful) {
    return toState(stateful)['features/visitors'].inQueueCount ?? 0;
}

/**
 * Whether visitor mode is supported.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {boolean} Whether visitor moder is supported.
 */
export function isVisitorsSupported(stateful: IStateful) {
    return toState(stateful)['features/visitors'].supported;
}

/**
 * Whether visitor mode is live.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {boolean} Whether visitor moder is live.
 */
export function isVisitorsLive(stateful: IStateful) {
    return toState(stateful)['features/base/conference'].metadata?.visitors?.live;
}

/**
 * Whether to show visitor queue screen.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {boolean} Whether current participant is visitor and is in queue.
 */
export function showVisitorsQueue(stateful: IStateful) {
    return toState(stateful)['features/visitors'].inQueue;
}

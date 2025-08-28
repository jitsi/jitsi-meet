import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
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
 * Returns the current visitor list.
 *
 * @param {IStateful} stateful - The redux store or {@code getState} function.
 * @returns {Array<Object>}
 */
export function getVisitorsList(stateful: IStateful) {
    return toState(stateful)['features/visitors'].visitors ?? [];
}

/**
 * Whether the visitors list websocket subscription has been requested.
 *
 * @param {IStateful} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function isVisitorsListSubscribed(stateful: IStateful) {
    return toState(stateful)['features/visitors'].visitorsListSubscribed;
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

/**
 * Checks if the visitors list feature is enabled based on JWT and config.js.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} Whether the feature is allowed.
 */
export function isVisitorsListEnabled(state: IReduxState): boolean {
    const { visitors: visitorsConfig } = state['features/base/config'];

    if (!visitorsConfig?.queueService) { // if the queue service is not configured, we can't retrieve the visitors list
        return false;
    }

    return isJwtFeatureEnabled(state, MEET_FEATURES.LIST_VISITORS, false);
}

/**
 * Determines whether the current visitors list should be displayed.
 *
 * @param {IStateful} stateful - The redux store or {@code getState} function.
 * @returns {boolean} Whether the visitors list should be shown.
 */
export function shouldDisplayCurrentVisitorsList(stateful: IStateful): boolean {
    const state = toState(stateful);

    return isVisitorsListEnabled(state) && getVisitorsCount(state) > 0;
}

/**
 *
 * @param state
 * @param displayName
 * @returns
 */
/**
 * Returns visitor's display name, falling back to the default remote display name
 * from config, or 'Fellow Jitster' if neither is available.
 *
 * @param {IReduxState} state - The Redux state.
 * @param {string} [displayName] - Optional display name to use if available.
 * @returns {string} - The display name for a visitor.
 */
export function getVisitorDisplayName(state: IReduxState, displayName?: string): string {
    return displayName || state['features/base/config'].defaultRemoteDisplayName || 'Fellow Jitster';
}

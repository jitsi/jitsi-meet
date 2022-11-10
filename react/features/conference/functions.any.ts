import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';
import { areThereNotifications } from '../notifications/functions';
import { getOverlayToRender } from '../overlay/functions';

/**
 * Tells whether or not the notifications should be displayed within
 * the conference feature based on the current Redux state.
 *
 * @param {Object|Function} stateful - The redux store state.
 * @returns {boolean}
 */
export function shouldDisplayNotifications(stateful: IStateful) {
    const state = toState(stateful);
    const isAnyOverlayVisible = Boolean(getOverlayToRender(state));
    const { calleeInfoVisible } = state['features/invite'];

    return areThereNotifications(state)
      && !isAnyOverlayVisible
      && !calleeInfoVisible;
}

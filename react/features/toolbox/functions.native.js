// @flow

import { TOOLBOX_ALWAYS_VISIBLE, getFeatureFlag } from '../base/flags';
import { toState } from '../base/redux';

/**
 * Returns true if the toolbox is visible.
 *
 * @param {Object | Function} stateful - A function or object that can be
 * resolved to Redux state by the function {@code toState}.
 * @returns {boolean}
 */
export function isToolboxVisible(stateful: Object | Function) {
    const state = toState(stateful);
    const { alwaysVisible, enabled, visible } = state['features/toolbox'];
    const { length: participantCount } = state['features/base/participants'];
    const flag = getFeatureFlag(state, TOOLBOX_ALWAYS_VISIBLE, false);

    return enabled && (alwaysVisible || visible || participantCount === 1 || flag);
}

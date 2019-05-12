// @flow

import { toState } from '../base/redux';

/**
 * Returns true if the toolbox is visible.
 *
 * @param {Object | Function} stateful - A function or object that can be
 * resolved to Redux state by the function {@code toState}.
 * @returns {boolean}
 */
export function isToolboxVisible(stateful: Object | Function) {
    const { alwaysVisible, enabled, visible }
        = toState(stateful)['features/toolbox'];

    return enabled && (alwaysVisible || visible);
}

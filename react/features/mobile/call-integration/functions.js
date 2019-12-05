// @flow

import { CALL_INTEGRATION_ENABLED, getFeatureFlag } from '../../base/flags';
import { toState } from '../../base/redux';

/**
 * Checks if call integration is enabled or not.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {string} - Default URL for the app.
 */
export function isCallIntegrationEnabled(stateful: Function | Object) {
    const state = toState(stateful);
    const { disableCallIntegration } = state['features/base/settings'];
    const flag = getFeatureFlag(state, CALL_INTEGRATION_ENABLED);

    // The feature flag has precedence.
    return flag ?? !disableCallIntegration;
}

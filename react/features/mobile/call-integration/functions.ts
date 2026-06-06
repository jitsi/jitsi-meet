import { IStateful } from '../../base/app/types';
import { CALL_INTEGRATION_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { toState } from '../../base/redux/functions';

/**
 * Checks if call integration is enabled or not.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {string} - Default URL for the app.
 */
export function isCallIntegrationEnabled(stateful: IStateful) {
    const state = toState(stateful);
    const { disableCallIntegration } = state['features/base/settings'];
    const flag = getFeatureFlag(state, CALL_INTEGRATION_ENABLED);

    // The feature flag has precedence.
    return flag ?? !disableCallIntegration;
}

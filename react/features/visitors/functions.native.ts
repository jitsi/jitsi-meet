import { IReduxState } from '../app/types';
import { GOLIVE_BUTTON_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';

export * from './functions.any';

/**
 * Returns the config whether Go Live button is enabled.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function isGoLiveButtonEnabled(state: IReduxState): string {
    return getFeatureFlag(state, GOLIVE_BUTTON_ENABLED, true);
}

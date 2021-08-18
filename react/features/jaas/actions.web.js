// @flow

import { openDialog } from '../base/dialog';

import { PremiumFeatureDialog } from './components';
import { isFeatureDisabled } from './functions';

/**
 * Shows a dialog prompting users to upgrade, if requested feature is disabled.
 *
 * @param {string} feature - The feature to check availability for.
 *
 * @returns {Function}
 */
export function maybeShowPremiumFeatureDialog(feature: string) {
    return function(dispatch: Function, getState: Function) {
        if (isFeatureDisabled(getState(), feature)) {
            dispatch(openDialog(PremiumFeatureDialog));

            return true;
        }

        return false;
    };
}

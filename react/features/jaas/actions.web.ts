import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';

import PremiumFeatureDialog from './components/web/PremiumFeatureDialog';
import { isFeatureDisabled } from './functions';

/**
 * Shows a dialog prompting users to upgrade, if requested feature is disabled.
 *
 * @param {string} feature - The feature to check availability for.
 *
 * @returns {Function}
 */
export function maybeShowPremiumFeatureDialog(feature: string) {
    return function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        if (isFeatureDisabled(getState(), feature)) {
            dispatch(openDialog(PremiumFeatureDialog));

            return true;
        }

        return false;
    };
}

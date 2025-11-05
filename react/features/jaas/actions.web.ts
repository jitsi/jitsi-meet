import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';
import { ParticipantFeaturesKey } from '../base/participants/types';

import PremiumFeatureDialog from './components/web/PremiumFeatureDialog';
import { isFeatureDisabled } from './functions';

/**
 * Shows a dialog prompting users to upgrade, if requested feature is disabled.
 *
 * @param {ParticipantFeaturesKey} feature - The feature to check availability for.
 *
 * @returns {Function}
 */
export function maybeShowPremiumFeatureDialog(feature: ParticipantFeaturesKey) {
    return function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        if (isFeatureDisabled(getState(), feature)) {
            dispatch(openDialog(PremiumFeatureDialog));

            return true;
        }

        return false;
    };
}

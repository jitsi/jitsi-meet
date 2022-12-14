/* eslint-disable lines-around-comment */
import { IStore } from '../app/types';
import { ADD_PEOPLE_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
// @ts-ignore
import { navigate } from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
// @ts-ignore
import { screen } from '../mobile/navigation/routes';
import { beginShareRoom } from '../share-room/actions';
/* eslint-enable lines-around-comment */

import { isAddPeopleEnabled, isDialOutEnabled } from './functions';

export * from './actions.any';

/**
 * Starts the process for inviting people. Dpending on the sysstem config it
 * may use the system share sheet or the invite peoplee dialog.
 *
 * @returns {Function}
 */
export function doInvitePeople() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const addPeopleEnabled = getFeatureFlag(state, ADD_PEOPLE_ENABLED, true)
            && (isAddPeopleEnabled(state) || isDialOutEnabled(state));

        if (addPeopleEnabled) {
            return navigate(screen.conference.invite);
        }

        return dispatch(beginShareRoom());
    };
}

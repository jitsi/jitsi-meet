// @flow

import type { Dispatch } from 'redux';

import { getFeatureFlag, ADD_PEOPLE_ENABLED } from '../base/flags';
import { navigate } from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';
import { beginShareRoom } from '../share-room';

import { isAddPeopleEnabled, isDialOutEnabled } from './functions';

export * from './actions.any';

/**
 * Starts the process for inviting people. Dpending on the sysstem config it
 * may use the system share sheet or the invite peoplee dialog.
 *
 * @returns {Function}
 */
export function doInvitePeople() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const addPeopleEnabled = getFeatureFlag(state, ADD_PEOPLE_ENABLED, true)
            && (isAddPeopleEnabled(state) || isDialOutEnabled(state));

        if (addPeopleEnabled) {
            return navigate(screen.conference.invite);
        }

        return dispatch(beginShareRoom());
    };
}

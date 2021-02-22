// @flow

import type { Dispatch } from 'redux';

import { getFeatureFlag, ADD_PEOPLE_ENABLED } from '../base/flags';
import { setActiveModalId } from '../base/modal';
import { beginShareRoom } from '../share-room';

import { ADD_PEOPLE_DIALOG_VIEW_ID } from './constants';
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
            return dispatch(setActiveModalId(ADD_PEOPLE_DIALOG_VIEW_ID));
        }

        return dispatch(beginShareRoom());
    };
}

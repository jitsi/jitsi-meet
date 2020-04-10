// @flow

import type { Dispatch } from 'redux';

import { getFeatureFlag, INVITE_ENABLED } from '../base/flags';
import { setActiveModalId } from '../base/modal';
import { beginShareRoom } from '../share-room';

import { isAddPeopleEnabled, isDialOutEnabled } from './functions';
import { ADD_PEOPLE_DIALOG_VIEW_ID } from './constants';

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
        const addPeopleEnabled = getFeatureFlag(state, INVITE_ENABLED, true)
            && (isAddPeopleEnabled(state) || isDialOutEnabled(state));

        if (addPeopleEnabled) {
            return dispatch(setActiveModalId(ADD_PEOPLE_DIALOG_VIEW_ID));
        }

        return dispatch(beginShareRoom());
    };
}

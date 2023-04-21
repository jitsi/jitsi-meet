/* eslint-disable lines-around-comment */
import { IStore } from '../app/types';
import { addPeopleFeatureControl } from '../base/participants/functions';
// @ts-ignore
import { navigate } from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
// @ts-ignore
import { screen } from '../mobile/navigation/routes';
import { beginShareRoom } from '../share-room/actions';
/* eslint-enable lines-around-comment */


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

        if (addPeopleFeatureControl(state)) {
            return navigate(screen.conference.invite);
        }

        return dispatch(beginShareRoom());
    };
}

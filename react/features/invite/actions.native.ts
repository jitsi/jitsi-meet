import { IStore } from '../app/types';
import { addPeopleFeatureControl } from '../base/participants/functions';
import { navigate } from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';
import { beginShareRoom } from '../share-room/actions';

export * from './actions.any';

/**
 * Starts the process for inviting people. Depending on the system config it
 * may use the system share sheet or the invite people dialog.
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

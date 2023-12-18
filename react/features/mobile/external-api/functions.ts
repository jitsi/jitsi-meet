import debounce from 'lodash/debounce';
import { NativeModules } from 'react-native';

import { IStore } from '../../app/types';
import { getParticipantDisplayName } from '../../base/participants/functions';
import { IParticipant } from '../../base/participants/types';

import { readyToClose } from './actions';


/**
 * Sends a specific event to the native counterpart of the External API. Native
 * apps may listen to such events via the mechanisms provided by the (native)
 * mobile Jitsi Meet SDK.
 *
 * @param {Object} store - The redux store.
 * @param {string} name - The name of the event to send.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code name}.
 * @returns {void}
 */
export function sendEvent(store: Object, name: string, data: Object) {
    NativeModules.ExternalAPI.sendEvent(name, data);
}

/**
 * Debounced sending of `readyToClose`.
 */
export const _sendReadyToClose = debounce(dispatch => {
    dispatch(readyToClose());
}, 2500, { leading: true });

/**
 * Returns a participant info object based on the passed participant object from redux.
 *
 * @param {Store} store - The redux store.
 * @param {Participant} participant - The participant object from the redux store.
 * @returns {Object} - The participant info object.
 */
export function participantToParticipantInfo(store: IStore, participant: IParticipant) {
    const state = store.getState();

    return {
        isLocal: participant.local,
        email: participant.email,
        name: getParticipantDisplayName(state, participant.id),
        participantId: participant.id,
        displayName: participant.displayName,
        avatarUrl: participant.avatarURL,
        role: participant.role
    };
}

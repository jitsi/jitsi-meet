import { debounce } from 'lodash-es';
import { NativeModules } from 'react-native';

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
 * Per-store `readyToClose` senders, so one app's teardown can't drop another's.
 */
const _readyToCloseSenders = new WeakMap<Function, Function>();

/**
 * Sends `readyToClose` once per burst of calls, with no trailing call to avoid a close() re-trigger loop.
 *
 * @param {Function} dispatch - The redux dispatch of the store sending the event.
 * @returns {void}
 */
export function _sendReadyToClose(dispatch: Function) {
    let send = _readyToCloseSenders.get(dispatch);

    if (!send) {
        send = debounce(() => dispatch(readyToClose()), 2500, { leading: true, trailing: false });
        _readyToCloseSenders.set(dispatch, send);
    }

    send();
}

/**
 * Returns a participant info object based on the passed participant object from redux.
 *
 * @param {Participant} participant - The participant object from the redux store.
 * @returns {Object} - The participant info object.
 */
export function participantToParticipantInfo(participant: IParticipant) {
    return {
        isLocal: participant.local,
        email: participant.email,
        name: participant.name,
        participantId: participant.id,
        displayName: participant.displayName,
        avatarUrl: participant.avatarURL,
        role: participant.role
    };
}

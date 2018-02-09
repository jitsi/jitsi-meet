// @flow

import uuid from 'uuid';

import { ADD_RECEIVED_REACTION } from './actionTypes';

/**
 * Creates a redux action which signals that a specific reaction has been
 * received by the local participant from a specific remote participant.
 *
 * @param {string} reaction - The reaction which has been received.
 * @param {Object} participant - The remote participant who sent the reaction.
 * @returns {{
 *     type: ADD_RECEIVED_REACTION,
 *     participant: Object,
 *     reaction: string
 * }}
 */
export function addReceivedReaction(reaction: string, participant: Object) {
    return {
        type: ADD_RECEIVED_REACTION,
        participant,
        reaction,
        uuid: uuid.v4()
    };
}

/**
 * Sends a specific reaction of the local participant to the remote
 * participants.
 *
 * @param {string} reaction - The reaction of the local participant to send to
 * the remote participants.
 * @returns {Function}
 */
export function sendReaction(reaction: string) {
    // reaction = 'thumbsup', 'heart', etc

    return (dispatch: Dispatch, getState: Function) => {
        const selectedEndpointId
            = getState()['features/base/conference']
                .conference.selectedEndpointId;
        const payload = {
            type: 'reaction',
            reaction,
            targetEndpoint: selectedEndpointId || 'target'
        };

        getState()['features/base/conference'].conference.sendTextMessage(
            JSON.stringify({
                'jitsi-meet-muc-msg-topic': 'xxx',
                payload
            }));

        // FIXME It's not a received reaction so rename the action creator.
        dispatch(addReceivedReaction(reaction, /* participant */ undefined));
    };
}

// @flow

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
    };
}

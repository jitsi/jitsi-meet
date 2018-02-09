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
        const payload = {
            type: 'reaction',
            reaction,
            targetEndpoint: 'target' // TODO use the selectedEndpoint
        };

        getState()['features/base/conference'].conference.sendTextMessage(
            JSON.stringify({
                'jitsi-meet-muc-msg-topic': 'xxx',
                payload
            }));
    };
}

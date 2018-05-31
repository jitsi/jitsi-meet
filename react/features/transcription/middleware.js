import { MiddlewareRegistry } from '../base/redux';
import { ENDPOINT_MESSAGE_RECEIVED } from './actionTypes';
import {
    addTranscriptMessage,
    removeTranscriptMessage,
    updateTranscriptMessage
} from './actions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
* Time after which the rendered subtitles will be removed.
*/
const REMOVE_AFTER_MS = 3000;

/**
 * Middleware that catches actions related to transcript messages
 * to be rendered in {@link TranscriptionSubtitles }
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {

    switch (action.type) {
    case ENDPOINT_MESSAGE_RECEIVED:
        return _endpointMessageReceived(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature transcription that the action
 * {@code ENDPOINT_MESSAGE_RECEIVED} is being dispatched within a specific redux
 * store.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to
 * dispatch the specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code ENDPOINT_MESSAGE_RECEIVED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _endpointMessageReceived({ dispatch, getState }, next, action) {
    const p = action.p;

    try {

        // Let's first check if the given object has the correct
        // topic in the payload, which identifies it as a json message send
        // from Jigasi with speech-to-to-text results
        // let p;
        // if (m['jitsi-meet-muc-msg-topic'] === TRANSCRIPTION_RESULT_TOPIC
        //         && (p = m.payload))
        // TODO: To be replaced by if(p['topic']==='transcription-result')\
        // after jigasi changes
        if (p.transcript) {
            // Extract the useful data from the payload of the JSON message
            const text = p.transcript[0].text;
            const stability = p.stability;
            const isInterim = p.is_interim;
            const transcriptMessageID = p.message_id;
            const participantName = p.participant.name;

            // If this is the first result with the unique message ID,
            // we add it to the state along with the name of the participant
            // who said given text
            if (!getState()['features/transcription']
                .transcriptMessages[transcriptMessageID]) {
                dispatch(addTranscriptMessage(transcriptMessageID,
                    participantName));
            }

            // If this is final result, update the state as a final result
            // and start a count down to remove the subtitle from the state
            if (!isInterim) {
                const { transcriptMessages }
                    = getState()['features/transcription'];
                const newTranscriptMessage
                    = transcriptMessages[transcriptMessageID];

                newTranscriptMessage.final = text;
                dispatch(updateTranscriptMessage(transcriptMessageID,
                    newTranscriptMessage));

                setTimeout(() => {
                    dispatch(removeTranscriptMessage(transcriptMessageID));
                }, REMOVE_AFTER_MS);
            } else if (stability > 0.85) {

                // If the message has a high stability, we can update the
                // stable field of the state and remove the previously
                // unstable results
                const { transcriptMessages }
                    = getState()['features/transcription'];
                const newTranscriptMessage
                    = transcriptMessages[transcriptMessageID];

                newTranscriptMessage.stable = text;
                newTranscriptMessage.unstable = undefined;
                dispatch(updateTranscriptMessage(transcriptMessageID,
                    newTranscriptMessage));
            } else {
                // Otherwise, this result has an unstable result, which we
                // add to the state. The unstable result will be localed at
                // the end of the String, after the stable part.

                const { transcriptMessages }
                    = getState()['features/transcription'];
                const newTranscriptMessage
                    = transcriptMessages[transcriptMessageID];

                newTranscriptMessage.unstable = text;
                dispatch(updateTranscriptMessage(transcriptMessageID,
                    newTranscriptMessage));
            }
        }
    } catch (error) {
        logger.error('Error occurred while updating transcriptions\n', error);
    }
    next(action);
}

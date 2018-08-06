// @flow

import { MiddlewareRegistry } from '../base/redux';

import { ENDPOINT_MESSAGE_RECEIVED } from './actionTypes';
import {
    removeTranscriptMessage,
    updateTranscriptMessage
} from './actions';

const logger = require('jitsi-meet-logger').getLogger(__filename);

declare var APP: Object;

/**
 * The type of json-message which indicates that json carries a
 * transcription result.
 */
const JSON_TYPE_TRANSCRIPTION_RESULT = 'transcription-result';

/**
 * The type of json-message which indicates that json carries a
 * translation result.
 */
const JSON_TYPE_TRANSLATION_RESULT = 'translation-result';

/**
 * The local participant property which is used to store the language
 * preference for translation for a participant.
 */
const P_NAME_TRANSLATION_LANGUAGE = 'translation_language';

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
    const json = action.json;
    const translationLanguage
        = getState()['features/base/conference'].conference
            .getLocalParticipantProperty(P_NAME_TRANSLATION_LANGUAGE);

    try {
        const transcriptMessageID = json.message_id;
        const participantName = json.participant.name;
        const isInterim = json.is_interim;
        const stability = json.stability;

        if (json.type === JSON_TYPE_TRANSLATION_RESULT
            && json.language === translationLanguage) {
            // Displays final results in the target language if translation is
            // enabled.

            const newTranscriptMessage = {
                participantName,
                final: json.text
            };

            dispatch(updateTranscriptMessage(transcriptMessageID,
                newTranscriptMessage));

            setTimeout(() => {
                dispatch(removeTranscriptMessage(transcriptMessageID));
            }, REMOVE_AFTER_MS);

        } else if (json.type === JSON_TYPE_TRANSCRIPTION_RESULT
            && !translationLanguage) {
            // Displays interim and final results without any translation if
            // translations are disabled.

            const text = json.transcript[0].text;

            // We update the previous transcript message with the same
            // message ID or adds a new transcript message if it does not
            // exist in the map.
            const newTranscriptMessage
                = { ...getState()['features/subtitles'].transcriptMessages
                    .get(transcriptMessageID) || { participantName } };

            // If this is final result, update the state as a final result
            // and start a count down to remove the subtitle from the state
            if (!isInterim) {

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

                newTranscriptMessage.stable = text;
                newTranscriptMessage.unstable = undefined;
                dispatch(updateTranscriptMessage(transcriptMessageID,
                    newTranscriptMessage));
            } else {
                // Otherwise, this result has an unstable result, which we
                // add to the state. The unstable result will be appended
                // after the stable part.

                newTranscriptMessage.unstable = text;
                dispatch(updateTranscriptMessage(transcriptMessageID,
                    newTranscriptMessage));
            }
        }
    } catch (error) {
        logger.error('Error occurred while updating transcriptions\n', error);
    }

    return next(action);
}

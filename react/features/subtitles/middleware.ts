import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { ENDPOINT_MESSAGE_RECEIVED } from '../base/conference/actionTypes';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { TRANSCRIBER_JOINED } from '../transcribing/actionTypes';

import {
    SET_REQUESTING_SUBTITLES,
    TOGGLE_REQUESTING_SUBTITLES
} from './actionTypes';
import {
    removeCachedTranscriptMessage,
    removeTranscriptMessage,
    setRequestingSubtitles,
    updateTranscriptMessage
} from './actions.any';
import { notifyTranscriptionChunkReceived } from './functions';
import logger from './logger';
import { ITranscriptMessage } from './types';


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
 * The local participant property which is used to set whether the local
 * participant wants to have a transcriber in the room.
 */
const P_NAME_REQUESTING_TRANSCRIPTION = 'requestingTranscription';

/**
 * The local participant property which is used to store the language
 * preference for translation for a participant.
 */
const P_NAME_TRANSLATION_LANGUAGE = 'translation_language';

/**
 * The dial command to use for starting a transcriber.
 */
const TRANSCRIBER_DIAL_NUMBER = 'jitsi_meet_transcribe';

/**
* Time after which the rendered subtitles will be removed.
*/
const REMOVE_AFTER_MS = 3000;

/**
 * Stability factor for a transcription. We'll treat a transcript as stable
 * beyond this value.
 */
const STABLE_TRANSCRIPTION_FACTOR = 0.85;

/**
 * Middleware that catches actions related to transcript messages to be rendered
 * in {@link Captions}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case ENDPOINT_MESSAGE_RECEIVED:
        return _endpointMessageReceived(store, next, action);

    case TOGGLE_REQUESTING_SUBTITLES: {
        const state = store.getState()['features/subtitles'];
        const toggledValue = !state._requestingSubtitles;

        _requestingSubtitlesChange(store, toggledValue, state._language);
        break;
    }
    case TRANSCRIBER_JOINED: {
        const { transcription } = store.getState()['features/base/config'];

        if (transcription?.autoCaptionOnTranscribe) {
            store.dispatch(setRequestingSubtitles(true));
        }

        break;
    }
    case SET_REQUESTING_SUBTITLES:
        _requestingSubtitlesChange(store, action.enabled, action.language);
        break;
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
function _endpointMessageReceived(store: IStore, next: Function, action: AnyAction) {
    const { data: json } = action;

    if (![ JSON_TYPE_TRANSCRIPTION_RESULT, JSON_TYPE_TRANSLATION_RESULT ].includes(json?.type)) {
        return next(action);
    }

    const { dispatch, getState } = store;
    const state = getState();
    const language
        = state['features/base/conference'].conference
            ?.getLocalParticipantProperty(P_NAME_TRANSLATION_LANGUAGE);
    const { dumpTranscript, skipInterimTranscriptions } = state['features/base/config'].testing ?? {};

    const transcriptMessageID = json.message_id;
    const { name, id, avatar_url: avatarUrl } = json.participant;
    const participant = {
        avatarUrl,
        id,
        name
    };

    let newTranscriptMessage: ITranscriptMessage | undefined;

    if (json.type === JSON_TYPE_TRANSLATION_RESULT && json.language === language) {
        // Displays final results in the target language if translation is
        // enabled.
        newTranscriptMessage = {
            clearTimeOut: undefined,
            final: json.text?.trim(),
            participant
        };
    } else if (json.type === JSON_TYPE_TRANSCRIPTION_RESULT) {
        // Displays interim and final results without any translation if
        // translations are disabled.

        const { text } = json.transcript[0];

        // First, notify the external API.
        if (!(json.is_interim && skipInterimTranscriptions)) {
            const txt: any = {};

            if (!json.is_interim) {
                txt.final = text;
            } else if (json.stability > STABLE_TRANSCRIPTION_FACTOR) {
                txt.stable = text;
            } else {
                txt.unstable = text;
            }

            notifyTranscriptionChunkReceived(
                transcriptMessageID,
                json.language,
                participant,
                txt,
                store
            );

            if (navigator.product !== 'ReactNative') {

                // Dump transcript in a <transcript> element for debugging purposes.
                if (!json.is_interim && dumpTranscript) {
                    try {
                        let elem = document.body.getElementsByTagName('transcript')[0];

                        // eslint-disable-next-line max-depth
                        if (!elem) {
                            elem = document.createElement('transcript');
                            document.body.appendChild(elem);
                        }

                        elem.append(`${new Date(json.timestamp).toISOString()} ${participant.name}: ${text}`);
                    } catch (_) {
                        // Ignored.
                    }
                }
            }
        }

        // If the user is not requesting transcriptions just bail.
        // Regex to filter out all possible country codes after language code:
        // this should catch all notations like 'en-GB' 'en_GB' and 'enGB'
        // and be independent of the country code length
        if (!language || (_getPrimaryLanguageCode(json.language) !== _getPrimaryLanguageCode(language))) {
            return next(action);
        }

        if (json.is_interim && skipInterimTranscriptions) {
            return next(action);
        }

        // We update the previous transcript message with the same
        // message ID or adds a new transcript message if it does not
        // exist in the map.
        const existingMessage = state['features/subtitles']._transcriptMessages.get(transcriptMessageID);

        newTranscriptMessage = {
            clearTimeOut: existingMessage?.clearTimeOut,
            participant
        };

        // If this is final result, update the state as a final result
        // and start a count down to remove the subtitle from the state
        if (!json.is_interim) {
            newTranscriptMessage.final = text;
        } else if (json.stability > STABLE_TRANSCRIPTION_FACTOR) {
            // If the message has a high stability, we can update the
            // stable field of the state and remove the previously
            // unstable results
            newTranscriptMessage.stable = text;
        } else {
            // Otherwise, this result has an unstable result, which we
            // add to the state. The unstable result will be appended
            // after the stable part.
            newTranscriptMessage.unstable = text;
        }
    }

    if (newTranscriptMessage) {
        if (newTranscriptMessage.final) {
            const cachedTranscriptMessage
                = state['features/subtitles']._cachedTranscriptMessages?.get(transcriptMessageID);

            if (cachedTranscriptMessage) {
                const cachedText = (cachedTranscriptMessage.stable || cachedTranscriptMessage.unstable)?.trim();
                const newText = newTranscriptMessage.final;

                if (cachedText && cachedText.length > 0 && newText && newText.length > 0
                    && newText.toLowerCase().startsWith(cachedText.toLowerCase())) {
                    newTranscriptMessage.final = newText.slice(cachedText.length)?.trim();
                }
                dispatch(removeCachedTranscriptMessage(transcriptMessageID));

                if (!newTranscriptMessage.final || newTranscriptMessage.final.length === 0) {
                    return next(action);
                }
            }
        }


        _setClearerOnTranscriptMessage(dispatch, transcriptMessageID, newTranscriptMessage);
        dispatch(updateTranscriptMessage(transcriptMessageID, newTranscriptMessage));
    }

    return next(action);
}

/**
 * Utility function to extract the primary language code like 'en-GB' 'en_GB'
 * 'enGB' 'zh-CN' and 'zh-TW'.
 *
 * @param {string} language - The language to use for translation or user requested.
 * @returns {string}
 */
function _getPrimaryLanguageCode(language: string) {
    return language.replace(/[-_A-Z].*/, '');
}

/**
 * Toggle the local property 'requestingTranscription'. This will cause Jicofo
 * and Jigasi to decide whether the transcriber needs to be in the room.
 *
 * @param {Store} store - The redux store.
 * @param {boolean} enabled - Whether subtitles should be enabled or not.
 * @param {string} language - The language to use for translation.
 * @private
 * @returns {void}
 */
function _requestingSubtitlesChange(
        { dispatch, getState }: IStore,
        enabled: boolean,
        language?: string | null) {
    const state = getState();
    const { conference } = state['features/base/conference'];

    conference?.setLocalParticipantProperty(
        P_NAME_REQUESTING_TRANSCRIPTION,
        enabled);

    if (enabled && conference?.getTranscriptionStatus() === JitsiMeetJS.constants.transcriptionStatus.OFF) {
        const featureAllowed = isJwtFeatureEnabled(getState(), MEET_FEATURES.TRANSCRIPTION, false);

        if (featureAllowed) {
            conference?.dial(TRANSCRIBER_DIAL_NUMBER)
                .catch((e: any) => {
                    logger.error('Error dialing', e);

                    // let's back to the correct state
                    dispatch(setRequestingSubtitles(false, false, null));
                });
        }
    }

    if (enabled && language) {
        conference?.setLocalParticipantProperty(
            P_NAME_TRANSLATION_LANGUAGE,
            language.replace('translation-languages:', ''));
    }
}

/**
 * Set a timeout on a TranscriptMessage object so it clears itself when it's not
 * updated.
 *
 * @param {Function} dispatch - Dispatch remove action to store.
 * @param {string} transcriptMessageID - The id of the message to remove.
 * @param {Object} transcriptMessage - The message to remove.
 * @returns {void}
 */
function _setClearerOnTranscriptMessage(
        dispatch: IStore['dispatch'],
        transcriptMessageID: string,
        transcriptMessage: { clearTimeOut?: number; }) {
    if (transcriptMessage.clearTimeOut) {
        clearTimeout(transcriptMessage.clearTimeOut);
    }

    transcriptMessage.clearTimeOut
        = window.setTimeout(
            () => dispatch(removeTranscriptMessage(transcriptMessageID)),
            REMOVE_AFTER_MS);
}

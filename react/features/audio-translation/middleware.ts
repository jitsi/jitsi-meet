import { JitsiAudioTranslationErrors, JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { showErrorNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import {
    CLEAR_AUDIO_TRANSLATION,
    SET_AUDIO_TRANSLATION_LANGUAGE,
    SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE
} from './actionTypes';
import { clearAudioTranslation, setParticipantAudioTranslationLanguage } from './actions';
import logger from './logger';

/**
 * Maps an audio-translation component error condition to a notification message key. Unmapped conditions
 * fall back to {@link DEFAULT_ERROR_KEY}.
 */
const ERROR_NOTIFICATION_KEYS: { [condition: string]: string; } = {
    [JitsiAudioTranslationErrors.FORBIDDEN]: 'audioTranslation.errorForbidden',
    [JitsiAudioTranslationErrors.SPEAKER_UNAVAILABLE]: 'audioTranslation.errorSpeakerUnavailable',
    [JitsiAudioTranslationErrors.SUBSCRIPTION_LIMIT_REACHED]: 'audioTranslation.errorLimitReached'
};

const DEFAULT_ERROR_KEY = 'audioTranslation.errorGeneric';

/**
 * Middleware that drives the bridge-side translation when the local user changes
 * the default or a per-participant audio-translation target language.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CLEAR_AUDIO_TRANSLATION: {
        const { conference } = store.getState()['features/base/conference'];

        if (conference) {
            logger.info('Clearing all audio translation state');
            conference.clearTranslation();
        }
        break;
    }
    case SET_AUDIO_TRANSLATION_LANGUAGE: {
        const { conference } = store.getState()['features/base/conference'];

        if (conference) {
            logger.info(`Setting audio translation language to ${action.language ?? 'off'}`);
            conference.setReceiverTranslationLanguage(action.language);
        }
        break;
    }
    case SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE: {
        const { conference } = store.getState()['features/base/conference'];

        if (conference) {
            logger.info(`Setting audio translation language for ${action.participantId} to ${action.language ?? 'off'}`);
            conference.setParticipantTranslationLanguage(action.participantId, action.language);
        }
        break;
    }
    }

    return result;
});

/**
 * Surfaces audio-translation request failures reported by the bridge-side component: shows a notification
 * describing the error condition and reverts the optimistic language selection for the affected speakers.
 */
StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch }, previousConference) => {
        if (!conference || previousConference) {
            return;
        }

        conference.on(JitsiConferenceEvents.AUDIO_TRANSLATION_FAILED,
            ({ endpointIds, error }: { endpointIds: string[]; error: string; }) => {
                logger.warn(`Audio translation request failed: ${error} for [${endpointIds.join(', ')}]`);

                dispatch(showErrorNotification({
                    titleKey: ERROR_NOTIFICATION_KEYS[error] ?? DEFAULT_ERROR_KEY
                }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

                if (error === JitsiAudioTranslationErrors.SUBSCRIPTION_LIMIT_REACHED) {
                    // Too many speakers translated at once — reset everything; the notification guides the
                    // user to enable translation per participant instead.
                    dispatch(clearAudioTranslation());

                    return;
                }

                // Otherwise undo the optimistic selection only for the speakers the failed request touched.
                endpointIds.forEach(endpointId =>
                    dispatch(setParticipantAudioTranslationLanguage(endpointId, null)));
            });
    });

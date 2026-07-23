import { JitsiAudioTranslationErrors, JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getLocalParticipant } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { showErrorNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import {
    CLEAR_AUDIO_TRANSLATION,
    SET_AUDIO_TRANSLATION_LANGUAGE,
    SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE
} from './actionTypes';
import {
    clearAudioTranslation,
    clearReceivingTranslatedSources,
    setParticipantAudioTranslationLanguage,
    setTranslationListeners,
    updateTranslatedSourceSending
} from './actions';
import { getSourceOwnerEndpointId, isAudioTranslationRoomEnabled } from './functions';
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
    // Block enabling a translation language while a moderator has disabled the feature for the room. Managers
    // keep the translation UI even when the room flag is off, and the bridge silently drops such requests, so
    // surface a notification here instead. Disabling (language === null) is always allowed through.
    if ((action.type === SET_AUDIO_TRANSLATION_LANGUAGE || action.type === SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE)
            && action.language
            && !isAudioTranslationRoomEnabled(store.getState())) {
        store.dispatch(showErrorNotification({
            titleKey: 'audioTranslation.errorRoomDisabled'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

        return;
    }

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

/**
 * Ingests the two per-participant translation signals from the conference: which translated sources the bridge
 * is forwarding to us (receiving), and which remote participants are translating us (enabled). Both are cleared
 * when the conference goes away.
 */
StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch, getState }, previousConference) => {
        if (previousConference) {
            dispatch(clearReceivingTranslatedSources());
            dispatch(setTranslationListeners([]));
        }

        if (!conference) {
            return;
        }

        conference.on(JitsiConferenceEvents.TRANSLATED_SOURCE_SENDING_CHANGED,
            ({ sending, sourceName, timestamp }: { sending: boolean; sourceName: string; timestamp: number; }) => {
                // The bridge currently emits only sending=true, which would leave the receiving state
                // stuck on; ignore the events unless explicitly enabled.
                if (!getState()['features/base/config'].audioTranslation?.enableSendingChangeEvents) {
                    return;
                }

                // The bridge broadcasts sending changes to every endpoint, including the translated
                // participant itself; our own translated source is not audio we receive.
                if (getSourceOwnerEndpointId(sourceName) === getLocalParticipant(getState())?.id) {
                    return;
                }
                dispatch(updateTranslatedSourceSending(sourceName, sending, timestamp));
            });

        conference.on(JitsiConferenceEvents.AUDIO_TRANSLATION_LISTENERS_CHANGED,
            (ids: string[]) => {
                dispatch(setTranslationListeners(ids));
            });
    });

/**
 * When a moderator disables audio translation for the room, clear the local user's active translation and notify
 * them. The room flag only blocks new requests on the bridge; it does not tear down active subscriptions. Clearing
 * locally drops the synthetic-source Include subscription (so the bridge stops forwarding the translated audio) and
 * un-ducks the original.
 */
StateListenerRegistry.register(
    state => isAudioTranslationRoomEnabled(state),
    (roomEnabled, { dispatch, getState }) => {
        if (roomEnabled) {
            return;
        }

        const { language, participantLanguages } = getState()['features/audio-translation'];

        if (language || Object.keys(participantLanguages).length > 0) {
            dispatch(clearAudioTranslation());
            dispatch(showNotification({
                titleKey: 'audioTranslation.disabledForRoom'
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        }
    });

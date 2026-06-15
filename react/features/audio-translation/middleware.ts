import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_AUDIO_TRANSLATION_LANGUAGE, SET_PARTICIPANT_AUDIO_TRANSLATION_LANGUAGE } from './actionTypes';
import logger from './logger';

/**
 * Middleware that drives the bridge-side translation when the local user changes
 * the default or a per-participant audio-translation target language.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
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

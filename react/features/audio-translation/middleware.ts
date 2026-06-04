import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_AUDIO_TRANSLATION_LANGUAGE } from './actionTypes';
import logger from './logger';

/**
 * Middleware that drives the bridge-side translation when the local user changes
 * the audio-translation target language.
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
    }

    return result;
});

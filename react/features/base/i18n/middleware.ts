import { SET_DYNAMIC_BRANDING_DATA } from '../../dynamic-branding/actionTypes';
import { getConferenceState } from '../conference/functions';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { I18NEXT_INITIALIZED, LANGUAGE_CHANGED } from './actionTypes';
import { changeLanguageBundle } from './functions';
import i18next from './i18next';
import logger from './logger';

/**
 * Implements the entry point of the middleware of the feature base/i18n.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case I18NEXT_INITIALIZED:
    case LANGUAGE_CHANGED:
    case SET_DYNAMIC_BRANDING_DATA: {
        const { language } = i18next;
        const { labels } = action.type === SET_DYNAMIC_BRANDING_DATA
            ? action.value
            : store.getState()['features/dynamic-branding'];

        if (language && labels?.[language]) {
            changeLanguageBundle(language, labels[language])
            .catch(err => {
                logger.log('Error setting dynamic language bundle', err);
            });
        }

        // Update transcription language, if applicable.
        if (action.type === SET_DYNAMIC_BRANDING_DATA) {
            const { defaultTranscriptionLanguage } = action.value;

            if (typeof defaultTranscriptionLanguage !== 'undefined') {
                const { conference } = getConferenceState(store.getState());

                conference?.setTranscriptionLanguage(defaultTranscriptionLanguage);
            }
        }

        break;
    }
    }

    return next(action);
});

import { SET_DYNAMIC_BRANDING_DATA } from '../../dynamic-branding/actionTypes';
import { getConferenceState } from '../conference/functions';
import { SET_CONFIG } from '../config/actionTypes';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { I18NEXT_INITIALIZED, LANGUAGE_CHANGED } from './actionTypes';
import { changeLanguageBundle } from './functions';
import i18next, { SUPPORTED_NS } from './i18next';
import logger from './logger';

/**
 * Implements the entry point of the middleware of the feature base/i18n.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_CONFIG: {
        // When config.js is fetched asynchronously (no window.config at boot),
        // configLanguageDetector returns undefined and i18next falls back. Once
        // the store has the config, apply its defaultLanguage if it differs
        // from what i18next picked.
        const defaultLanguage = action.config?.defaultLanguage;

        if (defaultLanguage && defaultLanguage !== i18next.language) {
            i18next.changeLanguage(defaultLanguage).catch(err => {
                logger.log('Error applying defaultLanguage from config', err);
            });
        }
        break;
    }
    case I18NEXT_INITIALIZED:
    case LANGUAGE_CHANGED:
    case SET_DYNAMIC_BRANDING_DATA: {
        const { language } = i18next;
        const data = action.type === SET_DYNAMIC_BRANDING_DATA
            ? action.value
            : store.getState()['features/dynamic-branding'];
        const labels = data?.labels;

        if (language && labels?.[language]) {
            changeLanguageBundle(language, labels[language])
            .catch(err => {
                logger.log('Error setting dynamic language bundle', err);
            });
        }

        SUPPORTED_NS.forEach(ns => {
            const nsLabels = data?.[`labels-${ns}`];

            if (language && nsLabels?.[language]) {
                changeLanguageBundle(language, nsLabels[language], ns)
                    .catch(err => {
                        logger.log(`Error setting dynamic language bundle for ${ns}`, err);
                    });
            }
        });

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

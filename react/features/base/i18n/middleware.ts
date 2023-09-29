import { SET_DYNAMIC_BRANDING_DATA } from '../../dynamic-branding/actionTypes';
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
MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {
    case I18NEXT_INITIALIZED:
    case LANGUAGE_CHANGED:
    case SET_DYNAMIC_BRANDING_DATA: {
        const { language } = i18next;
        const { labels } = action.type === SET_DYNAMIC_BRANDING_DATA
            ? action.value
            : store.getState()['features/dynamic-branding'];

        if (language && labels && labels[language]) {
            try {
                await changeLanguageBundle(language, labels[language]);
            } catch (err) {
                logger.log('Error setting dynamic language bundle', err);
            }
        }
        break;
    }
    }

    return next(action);
});

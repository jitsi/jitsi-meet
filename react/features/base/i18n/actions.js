// @flow
import { i18next } from './index';
import { SET_LANGUAGE } from './actionTypes';

/**
 * Makes an attempt to change the language.
 *
 * @param {string} newLanguage - The new language code which identifies
 * the language to be set.
 * @returns {Function}
 */
export function changeLanguage(newLanguage: string): Function {
    return function(dispatch: (Object) => Object) {
        return i18next.changeLanguage(newLanguage)
            .then(() => {
                dispatch(_setLanguage(i18next.language));
            });
    };
}

/**
 * Sets the current language on the Redux store.
 *
 * @param {string} language - The new language code that will be stored.
 * @returns {Object}
 * @private
 */
export function _setLanguage(language: string): Object {
    return {
        type: SET_LANGUAGE,
        language
    };
}

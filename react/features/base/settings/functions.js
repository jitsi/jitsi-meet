// @flow

import { parseURLParams } from '../config';
import { toState } from '../redux';


/**
 * Returns the effective value of a configuration/preference/setting by applying
 * a precedence among the values specified by JWT, URL, settings,
 * and config.
 *
 * @param {Object|Function} stateful - The redux state object or
 * {@code getState} function.
 * @param {string} propertyName - The name of the
 * configuration/preference/setting (property) to retrieve.
 * @param {{
 *     config: boolean,
 *     jwt: boolean,
 *     settings: boolean,
 *     urlParams: boolean
 * }} [sources] - A set/structure of {@code boolean} flags indicating the
 * configuration/preference/setting sources to consider/retrieve values from.
 * @returns {any}
 */
export function getPropertyValue(
        stateful: Object | Function,
        propertyName: string,
        sources?: Object
) {
    // Default values don't play nicely with partial objects and we want to make
    // the function easy to use without exhaustively defining all flags:
    sources = { // eslint-disable-line no-param-reassign
        // Defaults:
        config: true,
        jwt: true,
        settings: true,
        urlParams: true,

        ...sources
    };

    // Precedence: jwt -> urlParams -> settings -> config.

    const state = toState(stateful);

    // jwt
    if (sources.jwt) {
        const value = state['features/base/jwt'][propertyName];

        if (typeof value !== 'undefined') {
            return value[propertyName];
        }
    }

    // urlParams
    if (sources.urlParams) {
        const urlParams
            = parseURLParams(state['features/base/connection'].locationURL);
        const value = urlParams[`config.${propertyName}`];

        if (typeof value !== 'undefined') {
            return value;
        }
    }

    // settings
    if (sources.settings) {
        const value = state['features/base/settings'][propertyName];

        if (typeof value !== 'undefined') {
            return value;
        }
    }

    // config
    if (sources.config) {
        const value = state['features/base/config'][propertyName];

        if (typeof value !== 'undefined') {
            return value;
        }
    }

    return undefined;
}

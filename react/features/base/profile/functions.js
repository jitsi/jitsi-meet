// @flow

import { parseURLParams } from '../config';
import { toState } from '../redux';

/**
 * Returns the effective value of a property by applying a precedence
 * between values in URL, config and profile.
 *
 * @param {Object|Function} stateful - The redux state object or function
 * to retreive the state.
 * @param {string} propertyName - The name of the property we need.
 * @param {{
 *     ignoreJWT: boolean,
 *     ignoreUrlParams: boolean,
 *     ignoreProfile: boolean,
 *     ignoreConfig: boolean
 * }} precedence - A structure of booleans to set which property sources
 * should be ignored.
 * @returns {any}
 */
export function getPropertyValue(
        stateful: Object | Function,
        propertyName: string,
        precedence: Object = {
            ignoreJWT: false,
            ignoreUrlParams: false,
            ignoreProfile: false,
            ignoreConfig: false
        }
) {
    const state = toState(stateful);
    const jwt = state['features/base/jwt'];
    const urlParams
        = parseURLParams(state['features/base/connection'].locationURL);
    const profile = state['features/base/profile'];
    const config = state['features/base/config'];
    const urlParamName = `config.${propertyName}`;

    // Precedence: jwt -> urlParams -> profile -> config

    if (
        !precedence.ignoreJWT
        && typeof jwt[propertyName] !== 'undefined'
    ) {
        return jwt[propertyName];
    }

    if (
        !precedence.ignoreUrlParams
        && typeof urlParams[urlParamName] !== 'undefined'
    ) {
        return urlParams[urlParamName];
    }

    if (
        !precedence.ignoreProfile
        && typeof profile[propertyName] !== 'undefined'
    ) {
        return profile[propertyName];
    }

    if (!precedence.ignoreConfig) {
        return config[propertyName];
    }

    return undefined;
}

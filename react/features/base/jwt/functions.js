/* @flow */

import jwtDecode from 'jwt-decode';

import { parseURLParams } from '../util';

import { MEET_FEATURES } from './constants';

/**
 * Retrieves the JSON Web Token (JWT), if any, defined by a specific
 * {@link URL}.
 *
 * @param {URL} url - The {@code URL} to parse and retrieve the JSON Web Token
 * (JWT), if any, from.
 * @returns {string} The JSON Web Token (JWT), if any, defined by the specified
 * {@code url}; otherwise, {@code undefined}.
 */
export function parseJWTFromURLParams(url: URL = window.location) {
    return parseURLParams(url, true, 'search').jwt;
}

/**
 * Returns the user name after decoding the jwt.
 *
 * @param {Object} state - The app state.
 * @returns {string}
 */
export function getJwtName(state: Object) {
    const { user } = state['features/base/jwt'];

    return user?.name;
}

/**
 * Checks whether a given timestamp is a valid UNIX timestamp in seconds.
 * We convert to miliseconds during the check since `Date` works with miliseconds for UNIX timestamp values.
 *
 * @param {any} timestamp - A UNIX timestamp in seconds as stored in the jwt.
 * @returns {boolean} - Whether the timestamp is indeed a valid UNIX timestamp or not.
 */
function isValidUnixTimestamp(timestamp: any) {
    return typeof timestamp === 'number' && timestamp * 1000 === new Date(timestamp * 1000).getTime();
}

/**
 * Returns a list with all validation errors for the given jwt.
 *
 * @param {string} jwt - The jwt.
 * @returns {Array<string>} - An array containing all jwt validation errors.
 */
export function validateJwt(jwt: string) {
    const errors = [];

    if (!jwt) {
        return errors;
    }

    const currentTimestamp = new Date().getTime();

    try {
        const header = jwtDecode(jwt, { header: true });
        const payload = jwtDecode(jwt);

        if (!header || !payload) {
            errors.push('- Missing header or payload');

            return errors;
        }

        const {
            aud,
            context,
            exp,
            iss,
            nbf,
            sub
        } = payload;

        // JaaS only
        if (sub && sub.startsWith('vpaas-magic-cookie')) {
            const { kid } = header;

            // if Key ID is missing, we return the error immediately without further validations.
            if (!kid) {
                errors.push('- Key ID(kid) missing');

                return errors;
            }

            if (kid.substring(0, kid.indexOf('/')) !== sub) {
                errors.push('- Key ID(kid) does not match sub');
            }

            if (aud !== 'jitsi') {
                errors.push('- invalid `aud` value. It should be `jitsi`');
            }

            if (iss !== 'chat') {
                errors.push('- invalid `iss` value. It should be `chat`');
            }

            if (!context?.features) {
                errors.push('- `features` object is missing from the payload');
            }
        }

        if (!isValidUnixTimestamp(nbf)) {
            errors.push('- invalid `nbf` value');
        } else if (currentTimestamp < nbf * 1000) {
            errors.push('- `nbf` value is in the future');
        }

        if (!isValidUnixTimestamp(exp)) {
            errors.push('- invalid `exp` value');
        } else if (currentTimestamp > exp * 1000) {
            errors.push('- token is expired');
        }

        if (!context) {
            errors.push('- `context` object is missing from the payload');
        } else if (context.features) {
            const { features } = context;

            Object.keys(features).forEach(feature => {
                if (MEET_FEATURES.includes(feature)) {
                    const featureValue = features[feature];

                    // cannot use truthy or falsy because we need the exact value and type check.
                    if (
                        featureValue !== true
                        && featureValue !== false
                        && featureValue !== 'true'
                        && featureValue !== 'false'
                    ) {
                        errors.push(`- Invalid value for feature: ${feature}`);
                    }
                } else {
                    errors.push(`- Invalid feature: ${feature}`);
                }
            });
        }
    } catch (e) {
        errors.push(e ? e.message : '- unspecified jwt error');
    }

    return errors;
}

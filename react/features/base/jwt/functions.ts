// @ts-ignore
import jwtDecode from 'jwt-decode';

import { IReduxState } from '../../app/types';
import { getLocalParticipant } from '../participants/functions';
import { parseURLParams } from '../util/parseURLParams';

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
export function parseJWTFromURLParams(url: URL | Location = window.location) {
    // @ts-ignore
    return parseURLParams(url, true, 'search').jwt;
}

/**
 * Returns the user name after decoding the jwt.
 *
 * @param {IReduxState} state - The app state.
 * @returns {string}
 */
export function getJwtName(state: IReduxState) {
    const { user } = state['features/base/jwt'];

    return user?.name;
}

/**
 * Check if the given JWT feature is enabled.
 *
 * @param {IReduxState} state - The app state.
 * @param {string} feature - The feature we want to check.
 * @param {boolean} ifNoToken - Default value if there is no token.
 * @param {boolean} ifNotInFeatures - Default value if features prop exists but does not have the {@code feature}.
 * @returns {bolean}
 */
export function isJwtFeatureEnabled(state: IReduxState, feature: string, ifNoToken = false, ifNotInFeatures = false) {
    const { jwt } = state['features/base/jwt'];

    if (!jwt) {
        return ifNoToken;
    }

    const { features } = getLocalParticipant(state) || {};

    // If `features` is undefined, act as if everything is enabled.
    if (typeof features === 'undefined') {
        return true;
    }

    if (typeof features[feature as keyof typeof features] === 'undefined') {
        return ifNotInFeatures;
    }

    return String(features[feature as keyof typeof features]) === 'true';
}

/**
 * Checks whether a given timestamp is a valid UNIX timestamp in seconds.
 * We convert to milliseconds during the check since `Date` works with milliseconds for UNIX timestamp values.
 *
 * @param {any} timestamp - A UNIX timestamp in seconds as stored in the jwt.
 * @returns {boolean} - Whether the timestamp is indeed a valid UNIX timestamp or not.
 */
function isValidUnixTimestamp(timestamp: number | string) {
    return typeof timestamp === 'number' && timestamp * 1000 === new Date(timestamp * 1000).getTime();
}

/**
 * Returns a list with all validation errors for the given jwt.
 *
 * @param {string} jwt - The jwt.
 * @returns {Array<string>} - An array containing all jwt validation errors.
 */
export function validateJwt(jwt: string) {
    const errors: string[] = [];

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
        if (sub?.startsWith('vpaas-magic-cookie')) {
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
            const meetFeatures = Object.values(MEET_FEATURES);

            Object.keys(features).forEach(feature => {
                if (meetFeatures.includes(feature)) {
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
    } catch (e: any) {
        errors.push(e ? e.message : '- unspecified jwt error');
    }

    return errors;
}

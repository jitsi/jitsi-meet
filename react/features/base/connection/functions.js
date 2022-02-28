/* @flow */

import { toState } from '../redux';
import { toURLString } from '../util';

import { getURLWithoutParams } from './utils';

/**
 * Figures out what's the current conference URL which is supposed to indicate what conference is currently active.
 * When not currently in any conference and not trying to join any then 'undefined' is returned.
 *
 * @param {Object|Function} stateful - Either the whole Redux state object or the Redux store's {@code getState} method.
 * @returns {string|undefined}
 * @private
 */
export function getCurrentConferenceUrl(stateful: Function | Object) {
    const state = toState(stateful);
    let currentUrl;

    if (isInviteURLReady(state)) {
        currentUrl = toURLString(getInviteURL(state));
    }

    // Check if the URL doesn't end with a slash
    if (currentUrl && currentUrl.substr(-1) === '/') {
        currentUrl = undefined;
    }

    return currentUrl ? currentUrl : undefined;
}

/**
 * Retrieves a simplified version of the conference/location URL stripped of URL params (i.e. Query/search and hash)
 * which should be used for sending invites.
 * NOTE that the method will throw an error if called too early. That is before the conference is joined or before
 * the process of joining one has started. This limitation does not apply to the case when called with the URL object
 * instance. Use {@link isInviteURLReady} to check if it's safe to call the method already.
 *
 * @param {Function|Object} stateOrGetState - The redux state or redux's {@code getState} function or the URL object
 * to be stripped.
 * @returns {string}
 */
export function getInviteURL(stateOrGetState: Function | Object): string {
    const state = toState(stateOrGetState);
    let locationURL
        = state instanceof URL
            ? state
            : state['features/base/connection'].locationURL;

    // If there's no locationURL on the base/connection feature try the base/config where it's set earlier.
    if (!locationURL) {
        locationURL = state['features/base/config'].locationURL;
    }

    if (!locationURL) {
        throw new Error('Can not get invite URL - the app is not ready');
    }

    const { inviteDomain } = state['features/dynamic-branding'];
    const urlWithoutParams = getURLWithoutParams(locationURL);

    if (inviteDomain) {
        const meetingId
            = state['features/base/config'].brandingRoomAlias || urlWithoutParams.pathname.replace(/\//, '');

        return `${inviteDomain}/${meetingId}`;
    }

    return urlWithoutParams.href;
}

/**
 * Checks whether or not is safe to call the {@link getInviteURL} method already.
 *
 * @param {Function|Object} stateOrGetState - The redux state or redux's {@code getState} function.
 * @returns {boolean}
 */
export function isInviteURLReady(stateOrGetState: Function | Object): boolean {
    const state = toState(stateOrGetState);

    return Boolean(state['features/base/connection'].locationURL || state['features/base/config'].locationURL);
}

/**
 * Converts a specific id to jid if it's not jid yet.
 *
 * @param {string} id - User id or jid.
 * @param {Object} configHosts - The {@code hosts} part of the {@code config}
 * object.
 * @returns {string} A string in the form of a JID (i.e.
 * {@code user@server.com}).
 */
export function toJid(id: string, { authdomain, domain }: Object): string {
    return id.indexOf('@') >= 0 ? id : `${id}@${authdomain || domain}`;
}

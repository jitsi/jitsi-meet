/* @flow */

import { toState } from '../redux';

/**
 * Retrieves a simplified version of the conference/location URL stripped of URL
 * params (i.e. Query/search and hash) which should be used for sending invites.
 *
 * @param {Function|Object} stateOrGetState - The redux state or redux's
 * {@code getState} function.
 * @returns {string}
 */
export function getInviteURL(stateOrGetState: Function | Object): string {
    const state = toState(stateOrGetState);
    const locationURL
        = state instanceof URL
            ? state
            : state['features/base/connection'].locationURL;

    return getURLWithoutParams(locationURL).href;
}

/**
 * Gets a {@link URL} without hash and query/search params from a specific
 * {@code URL}.
 *
 * @param {URL} url - The {@code URL} which may have hash and query/search
 * params.
 * @returns {URL}
 */
export function getURLWithoutParams(url: URL): URL {
    const { hash, search } = url;

    if ((hash && hash.length > 1) || (search && search.length > 1)) {
        url = new URL(url.href); // eslint-disable-line no-param-reassign
        url.hash = '';
        url.search = '';

        // XXX The implementation of URL at least on React Native appends ? and
        // # at the end of the href which is not desired.
        let { href } = url;

        if (href) {
            href.endsWith('#') && (href = href.substring(0, href.length - 1));
            href.endsWith('?') && (href = href.substring(0, href.length - 1));

            // eslint-disable-next-line no-param-reassign
            url.href === href || (url = new URL(href));
        }
    }

    return url;
}

/**
 * Gets a URL string without hash and query/search params from a specific
 * {@code URL}.
 *
 * @param {URL} url - The {@code URL} which may have hash and query/search
 * params.
 * @returns {string}
 */
export function getURLWithoutParamsNormalized(url: URL): string {
    const urlWithoutParams = getURLWithoutParams(url).href;

    if (urlWithoutParams) {
        return urlWithoutParams.toLowerCase();
    }

    return '';
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

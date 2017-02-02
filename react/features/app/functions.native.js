import { isRoomValid } from '../base/conference';
import { RouteRegistry } from '../base/react';
import { Conference } from '../conference';
import { WelcomePage } from '../welcome';

/**
 * The RegExp pattern of the authority of a URI.
 *
 * @private
 * @type {string}
 */
const _URI_AUTHORITY_PATTERN = '(//[^/?#]+)';

/**
 * The RegExp pattern of the path of a URI.
 *
 * @private
 * @type {string}
 */
const _URI_PATH_PATTERN = '([^?#]*)';

/**
 * The RegExp patther of the protocol of a URI.
 *
 * @private
 * @type {string}
 */
const _URI_PROTOCOL_PATTERN = '([a-z][a-z0-9\\.\\+-]*:)';

/**
 * Fixes the hier-part of a specific URI (string) so that the URI is well-known.
 * For example, certain Jitsi Meet deployments are not conventional but it is
 * possible to translate their URLs into conventional.
 *
 * @param {string} uri - The URI (string) to fix the hier-part of.
 * @private
 * @returns {string}
 */
function _fixURIStringHierPart(uri) {
    // Rewrite the specified URL in order to handle special cases such as
    // hipchat.com and enso.me which do not follow the common pattern of most
    // Jitsi Meet deployments.

    // hipchat.com
    let regex
        = new RegExp(
                `^${_URI_PROTOCOL_PATTERN}//hipchat\\.com/video/call/`,
                'gi');
    let match = regex.exec(uri);

    if (!match) {
        // enso.me
        regex
            = new RegExp(
                    `^${_URI_PROTOCOL_PATTERN}//enso\\.me/(?:call|meeting)/`,
                    'gi');
        match = regex.exec(uri);
    }
    if (match) {
        /* eslint-disable no-param-reassign, prefer-template */

        uri
            = match[1] /* protocol */
                + '//enso.hipchat.me/'
                + uri.substring(regex.lastIndex); /* room (name) */

        /* eslint-enable no-param-reassign, prefer-template */
    }

    return uri;
}

/**
 * Fixes the scheme part of a specific URI (string) so that it contains a
 * well-known scheme such as HTTP(S). For example, the mobile app implements an
 * app-specific URI scheme in addition to Universal Links. The app-specific
 * scheme may precede or replace the well-known scheme. In such a case, dealing
 * with the app-specific scheme only complicates the logic and it is simpler to
 * get rid of it (by translating the app-specific scheme into a well-known
 * scheme).
 *
 * @param {string} uri - The URI (string) to fix the scheme of.
 * @private
 * @returns {string}
 */
function _fixURIStringScheme(uri) {
    const regex = new RegExp(`^${_URI_PROTOCOL_PATTERN}+`, 'gi');
    const match = regex.exec(uri);

    if (match) {
        // As an implementation convenience, pick up the last scheme and make
        // sure that it is a well-known one.
        let protocol = match[match.length - 1].toLowerCase();

        if (protocol !== 'http:' && protocol !== 'https:') {
            protocol = 'https:';
        }

        /* eslint-disable no-param-reassign */

        uri = uri.substring(regex.lastIndex);
        if (uri.startsWith('//')) {
            // The specified URL was not a room name only, it contained an
            // authority.
            uri = protocol + uri;
        }

        /* eslint-enable no-param-reassign */
    }

    return uri;
}

/**
 * Gets room name and domain from URL object.
 *
 * @param {URL} url - URL object.
 * @private
 * @returns {{
 *     domain: (string|undefined),
 *     room: (string|undefined)
 * }}
 */
function _getRoomAndDomainFromURLObject(url) {
    let domain;
    let room;

    if (url) {
        domain = url.hostname;

        // The room (name) is the last component of pathname.
        room = url.pathname;
        room = room.substring(room.lastIndexOf('/') + 1);

        // Convert empty string to undefined to simplify checks.
        if (room === '') {
            room = undefined;
        }
        if (domain === '') {
            domain = undefined;
        }
    }

    return {
        domain,
        room
    };
}

/**
 * Determines which route is to be rendered in order to depict a specific Redux
 * store.
 *
 * @param {(Object|Function)} stateOrGetState - Redux state or Regux getState()
 * method.
 * @returns {Route}
 */
export function _getRouteToRender(stateOrGetState) {
    const state
        = typeof stateOrGetState === 'function'
            ? stateOrGetState()
            : stateOrGetState;
    const room = state['features/base/conference'].room;
    const component = isRoomValid(room) ? Conference : WelcomePage;

    return RouteRegistry.getRouteByComponent(component);
}

/**
 * Parses a specific URI which (supposedly) references a Jitsi Meet resource
 * (location).
 *
 * @param {(string|undefined)} uri - The URI to parse which (supposedly)
 * references a Jitsi Meet resource (location).
 * @returns {{
 *     domain: (string|undefined),
 *     room: (string|undefined)
 * }}
 */
export function _parseURIString(uri) {
    let obj;

    if (typeof uri === 'string') {
        let str = uri;

        str = _fixURIStringScheme(str);
        str = _fixURIStringHierPart(str);

        obj = {};

        let regex;
        let match;

        // protocol
        regex = new RegExp(`^${_URI_PROTOCOL_PATTERN}`, 'gi');
        match = regex.exec(str);
        if (match) {
            obj.protocol = match[1].toLowerCase();
            str = str.substring(regex.lastIndex);
        }

        // authority
        regex = new RegExp(`^${_URI_AUTHORITY_PATTERN}`, 'gi');
        match = regex.exec(str);
        if (match) {
            let authority = match[1].substring(/* // */ 2);

            str = str.substring(regex.lastIndex);

            // userinfo
            const userinfoEndIndex = authority.indexOf('@');

            if (userinfoEndIndex !== -1) {
                authority = authority.substring(userinfoEndIndex + 1);
            }

            obj.host = authority;

            // port
            const portBeginIndex = authority.lastIndexOf(':');

            if (portBeginIndex !== -1) {
                obj.port = authority.substring(portBeginIndex + 1);
                authority = authority.substring(0, portBeginIndex);
            }

            obj.hostname = authority;
        }

        // pathname
        regex = new RegExp(`^${_URI_PATH_PATTERN}`, 'gi');
        match = regex.exec(str);
        if (match) {
            obj.pathname = match[1] || '/';
            str = str.substring(regex.lastIndex);
        }
    }

    return _getRoomAndDomainFromURLObject(obj);
}

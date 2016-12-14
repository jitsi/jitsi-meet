import { isRoomValid } from '../base/conference';
import { RouteRegistry } from '../base/navigator';
import { Conference } from '../conference';
import { WelcomePage } from '../welcome';

/**
 * Gets room name and domain from URL object.
 *
 * @param {URL} url - URL object.
 * @private
 * @returns {{
 *      domain: (string|undefined),
 *      room: (string|undefined)
 *  }}
 */
function _getRoomAndDomainFromUrlObject(url) {
    let domain;
    let room;

    if (url) {
        domain = url.hostname;
        room = url.pathname.substr(1);

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
 * Gets conference room name and connection domain from URL.
 *
 * @param {(string|undefined)} url - URL.
 * @returns {{
 *      domain: (string|undefined),
 *      room: (string|undefined)
 *  }}
 */
export function _getRoomAndDomainFromUrlString(url) {
    // Rewrite the specified URL in order to handle special cases such as
    // hipchat.com and enso.me which do not follow the common pattern of most
    // Jitsi Meet deployments.
    if (typeof url === 'string') {
        // hipchat.com
        let regex = /^(https?):\/\/hipchat.com\/video\/call\//gi;
        let match = regex.exec(url);

        if (!match) {
            // enso.me
            regex = /^(https?):\/\/enso\.me\/(?:call|meeting)\//gi;
            match = regex.exec(url);
        }
        if (match && match.length > 1) {
            /* eslint-disable no-param-reassign, prefer-template */

            url
                = match[1] /* URL protocol */
                   + '://enso.hipchat.me/'
                   + url.substring(regex.lastIndex);

            /* eslint-enable no-param-reassign, prefer-template */
        }
    }

    return _getRoomAndDomainFromUrlObject(_urlStringToObject(url));
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
 * Parses a string into a URL (object).
 *
 * @param {(string|undefined)} url - The URL to parse.
 * @private
 * @returns {URL}
 */
function _urlStringToObject(url) {
    let urlObj;

    if (url) {
        try {
            urlObj = new URL(url);
        } catch (ex) {
            // The return value will signal the failure & the logged
            // exception will provide the details to the developers.
            console.log(`${url} seems to be not a valid URL, but it's OK`, ex);
        }
    }

    return urlObj;
}

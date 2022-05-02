// @flow

import { parseURLParams } from './parseURLParams';
import { normalizeNFKC } from './strings';

/**
 * The app linking scheme.
 * TODO: This should be read from the manifest files later.
 */
export const APP_LINK_SCHEME = 'org.jitsi.meet:';

/**
 * A list of characters to be excluded/removed from the room component/segment
 * of a conference/meeting URI/URL. The list is based on RFC 3986 and the jxmpp
 * library utilized by jicofo.
 */
const _ROOM_EXCLUDE_PATTERN = '[\\:\\?#\\[\\]@!$&\'()*+,;=></"]';

/**
 * The {@link RegExp} pattern of the authority of a URI.
 *
 * @private
 * @type {string}
 */
const _URI_AUTHORITY_PATTERN = '(//[^/?#]+)';

/**
 * The {@link RegExp} pattern of the path of a URI.
 *
 * @private
 * @type {string}
 */
const _URI_PATH_PATTERN = '([^?#]*)';

/**
 * The {@link RegExp} pattern of the protocol of a URI.
 *
 * FIXME: The URL class exposed by JavaScript will not include the colon in
 * the protocol field. Also in other places (at the time of this writing:
 * the DeepLinkingMobilePage.js) the APP_LINK_SCHEME does not include
 * the double dots, so things are inconsistent.
 *
 * @type {string}
 */
export const URI_PROTOCOL_PATTERN = '^([a-z][a-z0-9\\.\\+-]*:)';

/**
 * Excludes/removes certain characters from a specific path part which are
 * incompatible with Jitsi Meet on the client and/or server sides. The main
 * use case for this method is to clean up the room name and the tenant.
 *
 * @param {?string} pathPart - The path part to fix.
 * @private
 * @returns {?string}
 */
function _fixPathPart(pathPart: ?string) {
    return pathPart
        ? pathPart.replace(new RegExp(_ROOM_EXCLUDE_PATTERN, 'g'), '')
        : pathPart;
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
function _fixURIStringScheme(uri: string) {
    const regex = new RegExp(`${URI_PROTOCOL_PATTERN}+`, 'gi');
    const match: Array<string> | null = regex.exec(uri);

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
 * Converts a path to a backend-safe format, by splitting the path '/' processing each part.
 * Properly lowercased and url encoded.
 *
 * @param {string?} path - The path to convert.
 * @returns {string?}
 */
export function getBackendSafePath(path: ?string): ?string {
    if (!path) {
        return path;
    }

    return path
        .split('/')
        .map(getBackendSafeRoomName)
        .join('/');
}

/**
 * Converts a room name to a backend-safe format. Properly lowercased and url encoded.
 *
 * @param {string?} room - The room name to convert.
 * @returns {string?}
 */
export function getBackendSafeRoomName(room: ?string): ?string {
    if (!room) {
        return room;
    }

    /* eslint-disable no-param-reassign */
    try {
        // We do not know if we get an already encoded string at this point
        // as different platforms do it differently, but we need a decoded one
        // for sure. However since decoding a non-encoded string is a noop, we're safe
        // doing it here.
        room = decodeURIComponent(room);
    } catch (e) {
        // This can happen though if we get an unencoded string and it contains
        // some characters that look like an encoded entity, but it's not.
        // But in this case we're fine goin on...
    }

    // Normalize the character set.
    room = normalizeNFKC(room);

    // Only decoded and normalized strings can be lowercased properly.
    room = room.toLowerCase();

    // But we still need to (re)encode it.
    room = encodeURIComponent(room);
    /* eslint-enable no-param-reassign */

    // Unfortunately we still need to lowercase it, because encoding a string will
    // add some uppercase characters, but some backend services
    // expect it to be full lowercase. However lowercasing an encoded string
    // doesn't change the string value.
    return room.toLowerCase();
}

/**
 * Gets the (Web application) context root defined by a specific location (URI).
 *
 * @param {Object} location - The location (URI) which defines the (Web
 * application) context root.
 * @public
 * @returns {string} - The (Web application) context root defined by the
 * specified {@code location} (URI).
 */
export function getLocationContextRoot({ pathname }: { pathname: string }) {
    const contextRootEndIndex = pathname.lastIndexOf('/');

    return (
        contextRootEndIndex === -1
            ? '/'
            : pathname.substring(0, contextRootEndIndex + 1));
}

/**
 * Constructs a new {@code Array} with URL parameter {@code String}s out of a
 * specific {@code Object}.
 *
 * @param {Object} obj - The {@code Object} to turn into URL parameter
 * {@code String}s.
 * @returns {Array<string>} The {@code Array} with URL parameter {@code String}s
 * constructed out of the specified {@code obj}.
 */
function _objectToURLParamsArray(obj = {}) {
    const params = [];

    for (const key in obj) { // eslint-disable-line guard-for-in
        try {
            params.push(
                `${key}=${encodeURIComponent(JSON.stringify(obj[key]))}`);
        } catch (e) {
            console.warn(`Error encoding ${key}: ${e}`);
        }
    }

    return params;
}

/**
 * Parses a specific URI string into an object with the well-known properties of
 * the {@link Location} and/or {@link URL} interfaces implemented by Web
 * browsers. The parsing attempts to be in accord with IETF's RFC 3986.
 *
 * @param {string} str - The URI string to parse.
 * @public
 * @returns {{
 *     hash: string,
 *     host: (string|undefined),
 *     hostname: (string|undefined),
 *     pathname: string,
 *     port: (string|undefined),
 *     protocol: (string|undefined),
 *     search: string
 * }}
 */
export function parseStandardURIString(str: string) {
    /* eslint-disable no-param-reassign */

    const obj: Object = {
        toString: _standardURIToString
    };

    let regex;
    let match: Array<string> | null;

    // XXX A URI string as defined by RFC 3986 does not contain any whitespace.
    // Usually, a browser will have already encoded any whitespace. In order to
    // avoid potential later problems related to whitespace in URI, strip any
    // whitespace. Anyway, the Jitsi Meet app is not known to utilize unencoded
    // whitespace so the stripping is deemed safe.
    str = str.replace(/\s/g, '');

    // protocol
    regex = new RegExp(URI_PROTOCOL_PATTERN, 'gi');
    match = regex.exec(str);
    if (match) {
        obj.protocol = match[1].toLowerCase();
        str = str.substring(regex.lastIndex);
    }

    // authority
    regex = new RegExp(`^${_URI_AUTHORITY_PATTERN}`, 'gi');
    match = regex.exec(str);
    if (match) {
        let authority: string = match[1].substring(/* // */ 2);

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

        // hostname
        obj.hostname = authority;
    }

    // pathname
    regex = new RegExp(`^${_URI_PATH_PATTERN}`, 'gi');
    match = regex.exec(str);

    let pathname: ?string;

    if (match) {
        pathname = match[1];
        str = str.substring(regex.lastIndex);
    }
    if (pathname) {
        pathname.startsWith('/') || (pathname = `/${pathname}`);
    } else {
        pathname = '/';
    }
    obj.pathname = pathname;

    // query
    if (str.startsWith('?')) {
        let hashBeginIndex = str.indexOf('#', 1);

        if (hashBeginIndex === -1) {
            hashBeginIndex = str.length;
        }
        obj.search = str.substring(0, hashBeginIndex);
        str = str.substring(hashBeginIndex);
    } else {
        obj.search = ''; // Google Chrome
    }

    // fragment
    obj.hash = str.startsWith('#') ? str : '';

    /* eslint-enable no-param-reassign */

    return obj;
}

/**
 * Parses a specific URI which (supposedly) references a Jitsi Meet resource
 * (location).
 *
 * @param {(string|undefined)} uri - The URI to parse which (supposedly)
 * references a Jitsi Meet resource (location).
 * @public
 * @returns {{
 *     contextRoot: string,
 *     hash: string,
 *     host: string,
 *     hostname: string,
 *     pathname: string,
 *     port: string,
 *     protocol: string,
 *     room: (string|undefined),
 *     search: string
 * }}
 */
export function parseURIString(uri: ?string) {
    if (typeof uri !== 'string') {
        return undefined;
    }

    const obj = parseStandardURIString(_fixURIStringScheme(uri));

    // XXX While the components/segments of pathname are URI encoded, Jitsi Meet
    // on the client and/or server sides still don't support certain characters.
    obj.pathname = obj.pathname.split('/').map(pathPart => _fixPathPart(pathPart))
        .join('/');

    // Add the properties that are specific to a Jitsi Meet resource (location)
    // such as contextRoot, room:

    // contextRoot
    obj.contextRoot = getLocationContextRoot(obj);

    // The room (name) is the last component/segment of pathname.
    const { pathname } = obj;

    const contextRootEndIndex = pathname.lastIndexOf('/');

    obj.room = pathname.substring(contextRootEndIndex + 1) || undefined;

    if (contextRootEndIndex > 1) {
        // The part of the pathname from the beginning to the room name is the tenant.
        obj.tenant = pathname.substring(1, contextRootEndIndex);
    }

    return obj;
}

/**
 * Implements {@code href} and {@code toString} for the {@code Object} returned
 * by {@link #parseStandardURIString}.
 *
 * @param {Object} [thiz] - An {@code Object} returned by
 * {@code #parseStandardURIString} if any; otherwise, it is presumed that the
 * function is invoked on such an instance.
 * @returns {string}
 */
function _standardURIToString(thiz: ?Object) {
    // eslint-disable-next-line no-invalid-this
    const { hash, host, pathname, protocol, search } = thiz || this;
    let str = '';

    protocol && (str += protocol);

    // TODO userinfo

    host && (str += `//${host}`);
    str += pathname || '/';
    search && (str += search);
    hash && (str += hash);

    return str;
}

/**
 * Sometimes we receive strings that we don't know if already percent-encoded, or not, due to the
 * various sources we get URLs or room names. This function encapsulates the decoding in a safe way.
 *
 * @param {string} text - The text to decode.
 * @returns {string}
 */
export function safeDecodeURIComponent(text: string) {
    try {
        return decodeURIComponent(text);
    } catch (e) {
        // The text wasn't encoded.
    }

    return text;
}

/**
 * Attempts to return a {@code String} representation of a specific
 * {@code Object} which is supposed to represent a URL. Obviously, if a
 * {@code String} is specified, it is returned. If a {@code URL} is specified,
 * its {@code URL#href} is returned. Additionally, an {@code Object} similar to
 * the one accepted by the constructor of Web's ExternalAPI is supported on both
 * mobile/React Native and Web/React.
 *
 * @param {Object|string} obj - The URL to return a {@code String}
 * representation of.
 * @returns {string} - A {@code String} representation of the specified
 * {@code obj} which is supposed to represent a URL.
 */
export function toURLString(obj: ?(Object | string)): ?string {
    let str;

    switch (typeof obj) {
    case 'object':
        if (obj) {
            if (obj instanceof URL) {
                str = obj.href;
            } else {
                str = urlObjectToString(obj);
            }
        }
        break;

    case 'string':
        str = String(obj);
        break;
    }

    return str;
}

/**
 * Attempts to return a {@code String} representation of a specific
 * {@code Object} similar to the one accepted by the constructor
 * of Web's ExternalAPI.
 *
 * @param {Object} o - The URL to return a {@code String} representation of.
 * @returns {string} - A {@code String} representation of the specified
 * {@code Object}.
 */
export function urlObjectToString(o: Object): ?string {
    // First normalize the given url. It come as o.url or split into o.serverURL
    // and o.room.
    let tmp;

    if (o.serverURL && o.room) {
        tmp = new URL(o.room, o.serverURL).toString();
    } else if (o.room) {
        tmp = o.room;
    } else {
        tmp = o.url || '';
    }

    const url = parseStandardURIString(_fixURIStringScheme(tmp));

    // protocol
    if (!url.protocol) {
        let protocol: ?string = o.protocol || o.scheme;

        if (protocol) {
            // Protocol is supposed to be the scheme and the final ':'. Anyway,
            // do not make a fuss if the final ':' is not there.
            protocol.endsWith(':') || (protocol += ':');
            url.protocol = protocol;
        }
    }

    // authority & pathname
    let { pathname } = url;

    if (!url.host) {
        // Web's ExternalAPI domain
        //
        // It may be host/hostname and pathname with the latter denoting the
        // tenant.
        const domain: ?string = o.domain || o.host || o.hostname;

        if (domain) {
            const { host, hostname, pathname: contextRoot, port }
                = parseStandardURIString(

                    // XXX The value of domain in supposed to be host/hostname
                    // and, optionally, pathname. Make sure it is not taken for
                    // a pathname only.
                    _fixURIStringScheme(`${APP_LINK_SCHEME}//${domain}`));

            // authority
            if (host) {
                url.host = host;
                url.hostname = hostname;
                url.port = port;
            }

            // pathname
            pathname === '/' && contextRoot !== '/' && (pathname = contextRoot);
        }
    }

    // pathname

    // Web's ExternalAPI roomName
    const room = o.roomName || o.room;

    if (room
            && (url.pathname.endsWith('/')
                || !url.pathname.endsWith(`/${room}`))) {
        pathname.endsWith('/') || (pathname += '/');
        pathname += room;
    }

    url.pathname = pathname;

    // query/search

    // Web's ExternalAPI jwt and lang
    const { jwt, lang } = o;

    const search = new URLSearchParams(url.search);

    if (jwt) {
        search.set('jwt', jwt);
    }

    const { defaultLanguage } = o.configOverwrite || {};

    if (lang || defaultLanguage) {
        search.set('lang', lang || defaultLanguage);
    }

    const searchString = search.toString();

    if (searchString) {
        url.search = `?${searchString}`;
    }

    // fragment/hash

    let { hash } = url;

    for (const urlPrefix of [ 'config', 'interfaceConfig', 'devices', 'userInfo', 'appData' ]) {
        const urlParamsArray
            = _objectToURLParamsArray(
                o[`${urlPrefix}Overwrite`]
                    || o[urlPrefix]
                    || o[`${urlPrefix}Override`]);

        if (urlParamsArray.length) {
            let urlParamsString
                = `${urlPrefix}.${urlParamsArray.join(`&${urlPrefix}.`)}`;

            if (hash.length) {
                urlParamsString = `&${urlParamsString}`;
            } else {
                hash = '#';
            }
            hash += urlParamsString;
        }
    }

    url.hash = hash;

    return url.toString() || undefined;
}

/**
 * Adds hash params to URL.
 *
 * @param {URL} url - The URL.
 * @param {Object} hashParamsToAdd - A map with the parameters to be set.
 * @returns {URL} - The new URL.
 */
export function addHashParamsToURL(url: URL, hashParamsToAdd: Object = {}) {
    const params = parseURLParams(url);
    const urlParamsArray = _objectToURLParamsArray({
        ...params,
        ...hashParamsToAdd
    });

    if (urlParamsArray.length) {
        url.hash = `#${urlParamsArray.join('&')}`;
    }

    return url;
}

/**
 * Returns the decoded URI.
 *
 * @param {string} uri - The URI to decode.
 * @returns {string}
 */
export function getDecodedURI(uri: string) {
    return decodeURI(uri.replace(/^https?:\/\//i, ''));
}

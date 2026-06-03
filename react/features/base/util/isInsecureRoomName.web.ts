import { isEqual } from 'lodash-es';
import { NIL, parse as parseUUID } from 'uuid';

// The null UUID.
const NIL_UUID = parseUUID(NIL);

const _zxcvbnCache = new Map();
let _zxcvbn: ((password: string) => { score: number; }) | null = null;

/**
 * Triggers the asynchronous load of the zxcvbn library if not already loaded.
 * Can be called early (e.g. on config load) to ensure the library is ready
 * before the first call to {@link isInsecureRoomName}.
 *
 * @returns {void}
 */
export function preloadZxcvbn() {
    _ensureZxcvbn();
}

/**
 * Triggers the asynchronous load of the zxcvbn library if not already loaded.
 *
 * @returns {void}
 */
function _ensureZxcvbn() {
    if (_zxcvbn !== null) {
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import(/* webpackChunkName: "zxcvbn" */ 'zxcvbn').then((m: any) => {
        _zxcvbn = m.default ?? m;
    });
}

/**
 * Checks if the given string is a valid UUID or not.
 *
 * @param {string} str - The string to be checked.
 * @returns {boolean} - Whether the string is a valid UUID or not.
 */
function isValidUUID(str: string) {
    let uuid;

    try {
        uuid = parseUUID(str);
    } catch (e) {
        return false;
    }

    return !isEqual(uuid, NIL_UUID);
}

/**
 * Checks a room name and caches the result.
 * Returns undefined if zxcvbn is not yet loaded.
 *
 * @param {string} roomName - The room name.
 * @returns {Object|undefined}
 */
function _checkRoomName(roomName = '') {
    if (_zxcvbnCache.has(roomName)) {
        return _zxcvbnCache.get(roomName);
    }

    _ensureZxcvbn();

    if (!_zxcvbn) {
        return undefined;
    }

    const result = _zxcvbn(roomName);

    _zxcvbnCache.set(roomName, result);

    return result;
}

/**
 * Returns true if the room name is considered a weak (insecure) one.
 * Returns false (treats as secure) while the zxcvbn library is still loading.
 *
 * @param {string} roomName - The room name.
 * @returns {boolean}
 */
export default function isInsecureRoomName(roomName = ''): boolean {

    // room names longer than 200 chars we consider secure
    return !isValidUUID(roomName) && (roomName.length < 200 && (_checkRoomName(roomName)?.score ?? 3) < 3);
}

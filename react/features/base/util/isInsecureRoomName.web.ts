import { isEqual } from 'lodash-es';
import { NIL, parse as parseUUID } from 'uuid';

// The null UUID.
const NIL_UUID = parseUUID(NIL);

const _zxcvbnCache = new Map();
let _zxcvbnPromise: Promise<any> | null = null;

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
 * Dynamically imports zxcvbn library.
 *
 * @returns {Promise} - Promise that resolves to zxcvbn module.
 */
function _getZxcvbn() {
    if (!_zxcvbnPromise) {
        _zxcvbnPromise = import(/* webpackChunkName: "zxcvbn" */ 'zxcvbn').then(module => module.default);
    }

    return _zxcvbnPromise;
}

/**
 * Checks a room name and caches the result.
 *
 * @param {string} roomName - The room name.
 * @returns {Promise<Object>} - Promise that resolves to zxcvbn result.
 */
async function _checkRoomName(roomName = '') {
    if (_zxcvbnCache.has(roomName)) {
        return _zxcvbnCache.get(roomName);
    }

    const zxcvbn = await _getZxcvbn();
    const result = zxcvbn(roomName);

    _zxcvbnCache.set(roomName, result);

    return result;
}

/**
 * Returns true if the room name is considered a weak (insecure) one.
 *
 * @param {string} roomName - The room name.
 * @returns {Promise<boolean>} - Promise that resolves to boolean.
 */
export default async function isInsecureRoomName(roomName = ''): Promise<boolean> {
    // room names longer than 200 chars we consider secure
    if (isValidUUID(roomName) || roomName.length >= 200) {
        return false;
    }

    const result = await _checkRoomName(roomName);

    return result.score < 3;
}

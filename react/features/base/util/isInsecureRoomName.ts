import { isEqual } from 'lodash-es';
import { NIL, parse as parseUUID } from 'uuid';
import zxcvbn from 'zxcvbn';

// The null UUID.
const NIL_UUID = parseUUID(NIL);

const _zxcvbnCache = new Map();

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
 *
 * @param {string} roomName - The room name.
 * @returns {Object}
 */
function _checkRoomName(roomName = '') {
    if (_zxcvbnCache.has(roomName)) {
        return _zxcvbnCache.get(roomName);
    }

    const result = zxcvbn(roomName);

    _zxcvbnCache.set(roomName, result);

    return result;
}

/**
 * Returns true if the room name is considered a weak (insecure) one.
 *
 * @param {string} roomName - The room name.
 * @returns {boolean}
 */
export default function isInsecureRoomName(roomName = ''): boolean {

    // room names longer than 200 chars we consider secure
    return !isValidUUID(roomName) && (roomName.length < 200 && _checkRoomName(roomName).score < 3);
}

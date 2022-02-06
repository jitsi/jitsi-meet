// @flow

import _ from 'lodash';
import { NIL, parse as parseUUID } from 'uuid';
import zxcvbn from 'zxcvbn';

// The null UUID.
const NIL_UUID = parseUUID(NIL);

/**
 * Checks if the given string is a valid UUID or not.
 *
 * @param {string} str - The string to be checked.
 * @returns {boolean} - Whether the string is a valid UUID or not.
 */
function isValidUUID(str) {
    let uuid;

    try {
        uuid = parseUUID(str);
    } catch (e) {
        return false;
    }

    return !_.isEqual(uuid, NIL_UUID);
}

/**
 * Returns true if the room name is considered a weak (insecure) one.
 *
 * @param {string} roomName - The room name.
 * @returns {boolean}
 */
export default function isInsecureRoomName(roomName: string = ''): boolean {
    return !isValidUUID(roomName) && zxcvbn(roomName).score < 3;
}

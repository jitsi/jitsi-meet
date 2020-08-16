// @flow

import zxcvbn from 'zxcvbn';

/**
 * Returns true if the room name is considered a weak (insecure) one.
 *
 * @param {string} roomName - The room name.
 * @returns {boolean}
 */
export default function isInsecureRoomName(roomName: string = ''): boolean {
    return zxcvbn(roomName).score < 3;
}

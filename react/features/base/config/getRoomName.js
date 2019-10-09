// @flow

import { getBackendSafeRoomName } from '../util';

/**
 * Builds and returns the room name.
 *
 * @returns {string}
 */
export default function getRoomName(): ?string {
    const path = window.location.pathname;

    // The last non-directory component of the path (name) is the room.
    const roomName = path.substring(path.lastIndexOf('/') + 1) || undefined;

    return getBackendSafeRoomName(roomName);
}

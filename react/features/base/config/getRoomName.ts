import { getBackendSafeRoomName } from '../util/uri';

/**
 * Builds and returns the room name.
 *
 * @returns {string}
 */
export default function getRoomName(): string | undefined {
    // In embedded (no-iframe) mode the URL belongs to the host page and does
    // not describe the conference, so the room name is provided explicitly by
    // the embedded API instead of being derived from the location.
    if (window._jitsiMeetEmbeddedRoomName) {
        return getBackendSafeRoomName(window._jitsiMeetEmbeddedRoomName);
    }

    const path = window.location.pathname;

    // The last non-directory component of the path (name) is the room.
    const roomName = path.substring(path.lastIndexOf('/') + 1) || undefined;

    return getBackendSafeRoomName(roomName);
}

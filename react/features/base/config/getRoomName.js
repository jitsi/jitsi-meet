/* @flow */

declare var config: Object;

/**
 * Builds and returns the room name.
 *
 * @returns {string}
 */
export default function getRoomName(): ?string {
    const { getroomnode } = config;
    const path = window.location.pathname;
    let roomName;

    // Determine the room node from the URL.
    if (getroomnode && typeof getroomnode === 'function') {
        roomName = getroomnode.call(config, path);
    } else {
        // Fall back to the default strategy of making assumptions about how the
        // URL maps to the room (name). It currently assumes a deployment in
        // which the last non-directory component of the path (name) is the
        // room.
        roomName
            = path.substring(path.lastIndexOf('/') + 1).toLowerCase()
                || undefined;
    }

    return roomName;
}

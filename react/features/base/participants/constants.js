/**
 * The relative path to the default/stock avatar (image) file used on both
 * Web/React and mobile/React Native (for the purposes of consistency).
 *
 * XXX (1) Web/React utilizes relativity on the Jitsi Meet deployment.
 * (2) Mobile/React Native utilizes relativity on the local file system at build
 * time. Unfortunately, the packager of React Native cannot deal with the
 * {@code const} early enough for {@code require} to succeed at runtime.
 * Anyway, be sure to synchronize the relative path on Web and mobile for the
 * purposes of consistency.
 *
 * @type {string}
 */
export const DEFAULT_AVATAR_RELATIVE_PATH = 'images/avatar.png';

/**
 * The local participant might not have real ID until she joins a conference,
 * so use 'local' as her default ID.
 *
 * @type {string}
 */
export const LOCAL_PARTICIPANT_DEFAULT_ID = 'local';

/**
 * The default display name of the local participant.
 *
 * TODO Get the display name from config and/or localized.
 *
 * @type {string}
 */
export const LOCAL_PARTICIPANT_DEFAULT_NAME = 'me';

/**
 * Max length of the display names.
 *
 * @type {string}
 */
export const MAX_DISPLAY_NAME_LENGTH = 50;

/**
 * The set of possible XMPP MUC roles for conference participants.
 *
 * @enum {string}
 */
export const PARTICIPANT_ROLE = {
    MODERATOR: 'moderator',
    NONE: 'none',
    PARTICIPANT: 'participant'
};

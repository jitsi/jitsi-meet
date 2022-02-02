// @flow

import { IconPhone } from '../icons';

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
 * The value for the "var" attribute of feature tag in disco-info packets.
 */
export const DISCO_REMOTE_CONTROL_FEATURE = 'http://jitsi.org/meet/remotecontrol';

/**
 * Icon URL for jigasi participants.
 *
 * @type {string}
 */
export const JIGASI_PARTICIPANT_ICON = IconPhone;

/**
 * The local participant might not have real ID until she joins a conference,
 * so use 'local' as her default ID.
 *
 * @type {string}
 */
export const LOCAL_PARTICIPANT_DEFAULT_ID = 'local';

/**
 * Max length of the display names.
 *
 * @type {string}
 */
export const MAX_DISPLAY_NAME_LENGTH = 50;

/**
 * The identifier of the sound to be played when new remote participant joins
 * the room.
 *
 * @type {string}
 */
export const PARTICIPANT_JOINED_SOUND_ID = 'PARTICIPANT_JOINED_SOUND';

/**
 * The identifier of the sound to be played when remote participant leaves
 * the room.
 *
 * @type {string}
 */
export const PARTICIPANT_LEFT_SOUND_ID = 'PARTICIPANT_LEFT_SOUND';

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

/**
 * The audio level at which the hand will be lowered if raised.
 *
 * @type {string}
 */
export const LOWER_HAND_AUDIO_LEVEL = 0.2;

import { INCOMING_MSG_SOUND_ID } from './constants';

/**
 * Object of the sound ID with the filename sounds associated with them.
 *
 * @type {Object<string, string, object, boolean>}
 */
export const INCOMING_MSG_SOUND = {
    id: INCOMING_MSG_SOUND_ID,
    file: 'incomingMessage.mp3',
    options: {
        moderation: true,
        optional: true
    },
    optional: true
};

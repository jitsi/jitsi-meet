import { TALK_WHILE_MUTED_SOUND_ID } from './constants';

/**
 * The file used for the talk while muted sound notification.
 *
 * @type {object<string, string, object, boolean>}
 */
export const TALK_WHILE_MUTED_SOUND_FILE = 'talkWhileMuted.mp3';

export const TALK_WHILE_MUTED_SOUND = {
    id: TALK_WHILE_MUTED_SOUND_ID,
    file: 'talkWhileMuted.mp3',
    options: {
        moderation: true,
        optional: true
    },
    optional: true
};

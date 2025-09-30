import { E2EE_OFF_SOUND_ID, E2EE_ON_SOUND_ID } from './constants';

/**
 * The identifier of the sound to be played when e2ee is disabled.
 *
 * @type {Object<string, string, object, boolean, boolean>}
 */

export const E2EE_OFF_SOUND = {
    id: E2EE_OFF_SOUND_ID,
    file: 'e2eeOff.mp3',
    options: {
        moderation: false,
        optional: false
    },
    optional: false,
    languages: true
};

/**
 * The identifier of the sound to be played when e2ee is enabled.
 *
 * @type {Object<string, string, object, boolean, boolean>}
 */
export const E2EE_ON_SOUND = {
    id: E2EE_ON_SOUND_ID,
    file: 'e2eeOn.mp3',
    options: {
        moderation: false,
        optional: false
    },
    optional: false,
    languages: true
};

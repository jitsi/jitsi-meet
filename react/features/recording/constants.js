// @flow

/**
 * The identifier of the sound to be played when a recording or live streaming
 * session is started.
 *
 * @type {string}
 */
export const RECORDING_ON_SOUND_ID = 'RECORDING_ON_SOUND';

/**
 * The identifier of the sound to be played when a recording or live streaming
 * session is stopped.
 *
 * @type {string}
 */
export const RECORDING_STOPPED_SOUND_ID = 'RECORDING_STOPPED_SOUND';

/**
 * Expected supported recording types. JIBRI is known to support live streaming
 * whereas JIRECON is for recording.
 *
 * @type {Object}
 */
export const RECORDING_TYPES = {
    JIBRI: 'jibri',
    JIRECON: 'jirecon'
};

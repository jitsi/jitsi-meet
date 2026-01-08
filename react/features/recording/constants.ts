import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';


/**
 * The identifier of the sound to be played when a live streaming session is stopped.
 *
 * @type {string}
 */
export const LIVE_STREAMING_OFF_SOUND_ID = 'LIVE_STREAMING_OFF_SOUND';

/**
 * The identifier of the sound to be played when a live streaming session is started.
 *
 * @type {string}
 */
export const LIVE_STREAMING_ON_SOUND_ID = 'LIVE_STREAMING_ON_SOUND';

/**
 * The identifier of the prompt to start recording notification.
 *
 * @type {string}
 */
export const PROMPT_RECORDING_NOTIFICATION_ID = 'PROMPT_RECORDING_NOTIFICATION_ID';

/**
 * The identifier of the sound to be played when a recording session is stopped.
 *
 * @type {string}
 */
export const RECORDING_OFF_SOUND_ID = 'RECORDING_OFF_SOUND';

/**
 * The identifier of the sound to be played when a recording session is started.
 *
 * @type {string}
 */
export const RECORDING_ON_SOUND_ID = 'RECORDING_ON_SOUND';

/**
 * Expected supported recording types.
 *
 * @enum {string}
 */
export const RECORDING_TYPES = {
    JITSI_REC_SERVICE: 'recording-service',
    DROPBOX: 'dropbox',
    LOCAL: 'local'
};

/**
 * An array defining the priorities of the recording (or live streaming)
 * statuses, where the index of the array is the priority itself.
 *
 * @type {Array<string>}
 */
export const RECORDING_STATUS_PRIORITIES = [
    JitsiRecordingConstants.status.OFF,
    JitsiRecordingConstants.status.PENDING,
    JitsiRecordingConstants.status.ON
];

export const START_RECORDING_NOTIFICATION_ID = 'START_RECORDING_NOTIFICATION_ID';

export const RECORDING_METADATA_ID = 'recording';

import { LIVE_STREAMING_OFF_SOUND_ID, LIVE_STREAMING_ON_SOUND_ID, RECORDING_OFF_SOUND_ID, RECORDING_ON_SOUND_ID } from './constants';

/**
 * The sound definition for when live streaming is stopped.
 *
 * @type {Object<id: string, file: string, options: object, optional: boolean, languages: boolean>}
 */
export const LIVE_STREAMING_OFF_SOUND = {
    id: LIVE_STREAMING_OFF_SOUND_ID,
    file: 'liveStreamingOff.mp3',
    options: {},
    optional: false,
    languages: true
};

/**
 * The sound definition for when live streaming is started.
 *
 * @type {Object<id: string, file: string, options: object, optional: boolean, languages: boolean>}
 */
export const LIVE_STREAMING_ON_SOUND = {
    id: LIVE_STREAMING_ON_SOUND_ID,
    file: 'liveStreamingOn.mp3',
    options: {},
    optional: false,
    languages: true
};

/**
 * The sound definition for when a recording is stopped.
 *
 * @type {Object<id: string, file: string, options: object, optional: boolean, languages: boolean>}
 */
export const RECORDING_OFF_SOUND = {
    id: RECORDING_OFF_SOUND_ID,
    file: 'recordingOff.mp3',
    options: {},
    optional: false,
    languages: true
};

/**
 * The sound definition for when a recording is started.
 *
 * @type {Object<id: string, file: string, options: object, optional: boolean, languages: boolean>}
 */
export const RECORDING_ON_SOUND = {
    id: RECORDING_ON_SOUND_ID,
    file: 'recordingOn.mp3',
    options: {},
    optional: false,
    languages: true
};

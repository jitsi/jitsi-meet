// @flow

import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';

/**
 * Expected supported recording types.
 *
 * @enum {string}
 */
export const RECORDING_TYPES = {
    JITSI_REC_SERVICE: 'recording-service',
    DROPBOX: 'dropbox'
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

import {
    OUTGOING_CALL_EXPIRED_SOUND_ID,
    OUTGOING_CALL_REJECTED_SOUND_ID,
    OUTGOING_CALL_RINGING_SOUND_ID,
    OUTGOING_CALL_START_SOUND_ID
} from './constants';

/**
 * Maps the sounds IDs with the filenames sounds associated with them.
 *
 * @type {Map<string, string>}
 */
export const sounds = new Map([

    /**
     * The name of the sound file which will be played when outgoing call is
     * expired.
     */
    [ OUTGOING_CALL_EXPIRED_SOUND_ID, { file: 'rejected.wav' } ],

    /**
     * The name of the sound file which will be played when outgoing call is
     * rejected.
     */
    [ OUTGOING_CALL_REJECTED_SOUND_ID, { file: 'rejected.wav' } ],

    /**
     * The name of the sound file which will be played when the status of an
     * outgoing call is ringing.
     */
    [
        OUTGOING_CALL_RINGING_SOUND_ID,
        {
            file: 'outgoingRinging.wav',
            options: { loop: true }
        }
    ],

    /**
     * The name of the sound file which will be played when outgoing call is
     * started.
     */
    [ OUTGOING_CALL_START_SOUND_ID, { file: 'outgoingStart.wav' } ]
]);

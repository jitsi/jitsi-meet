// @flow

/**
 * Modal ID for the AddPeopleDialog modal.
 */
export const ADD_PEOPLE_DIALOG_VIEW_ID = 'ADD_PEOPLE_DIALOG_VIEW_ID';

/**
 * Modal ID for the DialInSummary modal.
 */
export const DIAL_IN_SUMMARY_VIEW_ID = 'DIAL_IN_SUMMARY_VIEW_ID';

/**
 * The identifier of the sound to be played when the status of an outgoing call
 * is expired.
 *
 * @type {string}
 */
export const OUTGOING_CALL_EXPIRED_SOUND_ID
    = 'OUTGOING_CALL_EXPIRED_SOUND_ID';

/**
 * The identifier of the sound to be played when the status of an outgoing call
 * is rejected.
 *
 * @type {string}
 */
export const OUTGOING_CALL_REJECTED_SOUND_ID
    = 'OUTGOING_CALL_REJECTED_SOUND_ID';

/**
 * The identifier of the sound to be played when the status of an outgoing call
 * is ringing.
 *
 * @type {string}
 */
export const OUTGOING_CALL_RINGING_SOUND_ID = 'OUTGOING_CALL_RINGING_SOUND_ID';

/**
 * The identifier of the sound to be played when outgoing call is started.
 *
 * @type {string}
 */
export const OUTGOING_CALL_START_SOUND_ID = 'OUTGOING_CALL_START_SOUND_ID';

/**
 * Regex for matching email addresses.
 */
// eslint-disable-next-line max-len
export const EMAIL_ADDRESS_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

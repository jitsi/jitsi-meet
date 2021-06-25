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
 * Regex for matching sip addresses.
 */
// eslint-disable-next-line max-len
export const SIP_ADDRESS_REGEX = /^[+a-zA-Z0-9]+(?:([^\s>:@]+)(?::([^\s@>]+))?@)?([\w\-.]+)(?::(\d+))?((?:;[^\s=?>;]+(?:=[^\s?;]+)?)*)(?:\?(([^\s&=>]+=[^\s&=>]+)(&[^\s&=>]+=[^\s&=>]+)*))?$/;

/**
 * Different invite types mapping
 */
export const INVITE_TYPES = {
    PHONE: 'phone',
    ROOM: 'room',
    SIP: 'sip',
    USER: 'user',
    VIDEO_ROOM: 'videosipgw'
};

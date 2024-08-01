/**
 * The pathName for the dialInInfo page.
 *
 * @type {string}
 */
export const DIAL_IN_INFO_PAGE_PATH_NAME = 'static/dialInInfo.html';

/**
 * The identifier of the sound to be played when the status of an outgoing call
 * is expired.
 *
 * @type {string}
 */
export const OUTGOING_CALL_EXPIRED_SOUND_ID
    = 'OUTGOING_CALL_EXPIRED_SOUND';

/**
 * The identifier of the sound to be played when the status of an outgoing call
 * is rejected.
 *
 * @type {string}
 */
export const OUTGOING_CALL_REJECTED_SOUND_ID
    = 'OUTGOING_CALL_REJECTED_SOUND';

/**
 * The identifier of the sound to be played when the status of an outgoing call
 * is ringing.
 *
 * @type {string}
 */
export const OUTGOING_CALL_RINGING_SOUND_ID = 'OUTGOING_CALL_RINGING_SOUND';

/**
 * The identifier of the sound to be played when outgoing call is started.
 *
 * @type {string}
 */
export const OUTGOING_CALL_START_SOUND_ID = 'OUTGOING_CALL_START_SOUND';

/**
 * Regex for matching sip addresses.
 */
// eslint-disable-next-line max-len
export const SIP_ADDRESS_REGEX = /^[+a-zA-Z0-9]+(?:([^\s>:@]+)(?::([^\s@>]+))?@)?([\w\-.]+)(?::(\d+))?((?:;[^\s=?>;]+(?:=[^\s?;]+)?)*)(?:\?(([^\s&=>]+=[^\s&=>]+)(&[^\s&=>]+=[^\s&=>]+)*))?$/;

/**
 * Different invite types mapping.
 */
export const INVITE_TYPES = {
    EMAIL: 'email',
    PHONE: 'phone',
    ROOM: 'room',
    SIP: 'sip',
    USER: 'user',
    VIDEO_ROOM: 'videosipgw'
};

export const UPGRADE_OPTIONS_TEXT = 'jaas.8x8.vc';
export const UPGRADE_OPTIONS_LINK = 'https://jaas.8x8.vc/#/plan/upgrade';

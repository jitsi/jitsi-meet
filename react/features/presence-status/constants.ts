// User invite statuses

/**
 * Тhe status for a participant when it's invited to a conference.
 *
 * @type {string}
 */
export const INVITED = 'Invited';

/**
 * Тhe status for a participant when a call has been initiated.
 *
 * @type {string}
 */
export const CALLING = 'calling';

/**
 * Тhe status for a participant when the invite is received and its device(s)
 * are ringing.
 *
 * @type {string}
 */
export const RINGING = 'ringing';

/**
 * A status for a participant that indicates the call is connected.
 *
 * @type {string}
 */
export const CONNECTED_USER = 'connected';

/**
 * The status for a participant when the invitation is received but the user
 * has responded with busy message.
 *
 * @type {string}
 */
export const BUSY = 'busy';

/**
 * The status for a participant when the invitation is rejected.
 *
 * @type {string}
 */
export const REJECTED = 'rejected';

/**
 * The status for a participant when the invitation is ignored.
 *
 * @type {string}
 */
export const IGNORED = 'ignored';

/**
  * The status for a participant when the invitation is expired.
 *
 * @type {string}
 */
export const EXPIRED = 'expired';

// Phone call statuses

/**
 * A status for a participant that indicates the call is in process of
 * initialization.
 * NOTE: Currently used for phone numbers only.
 *
 * @type {string}
 */
export const INITIALIZING_CALL = 'Initializing Call';

/**
 * A status for a participant that indicates the call is in process of
 * connecting.
 * NOTE: Currently used for phone numbers only.
 *
 * @type {string}
 */
export const CONNECTING = 'Connecting';

/**
 * A status for a participant that indicates the call is in process of
 * connecting.
 * NOTE: Currently used for phone numbers only.
 *
 * @type {string}
 */
export const CONNECTING2 = 'Connecting*';


/**
 * A status for a phone number participant that indicates the call is connected.
 *
 * @type {string}
 */
export const CONNECTED_PHONE_NUMBER = 'Connected';


/**
 * A status for a participant that indicates the call is disconnected.
 * NOTE: Currently used for phone numbers only.
 *
 * @type {string}
 */
export const DISCONNECTED = 'Disconnected';

/**
 * Maps the presence status values to i18n translation keys.
 *
 * @type {Object<String, String>}
 */
export const STATUS_TO_I18N_KEY = {
    [INVITED]: 'presenceStatus.invited',
    [RINGING]: 'presenceStatus.ringing',
    [CALLING]: 'presenceStatus.calling',
    [BUSY]: 'presenceStatus.busy',
    [REJECTED]: 'presenceStatus.rejected',
    [IGNORED]: 'presenceStatus.ignored',
    [EXPIRED]: 'presenceStatus.expired',

    [INITIALIZING_CALL]: 'presenceStatus.initializingCall',
    [CONNECTING]: 'presenceStatus.connecting',
    [CONNECTING2]: 'presenceStatus.connecting2',
    [CONNECTED_PHONE_NUMBER]: 'presenceStatus.connected',
    [CONNECTED_USER]: 'presenceStatus.connected',
    [DISCONNECTED]: 'presenceStatus.disconnected'
};

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
export const CALLING = 'Calling';

/**
 * Тhe status for a participant when the invite is received and its device(s)
 * are ringing.
 *
 * @type {string}
 */
export const RINGING = 'Ringing';

/**
 * A status for a participant that indicates the call is connected.
 * NOTE: Currently used for phone numbers only.
 *
 * @type {string}
 */
export const CONNECTED = 'Connected';

/**
 * A status for a participant that indicates the call is in process of
 * connecting.
 * NOTE: Currently used for phone numbers only.
 *
 * @type {string}
 */
export const CONNECTING = 'Connecting';

/**
 * The status for a participant when the invitation is received but the user
 * has responded with busy message.
 */
export const BUSY = 'Busy';

/**
 * The status for a participant when the invitation is rejected.
 */
export const REJECTED = 'Rejected';

/**
 * The status for a participant when the invitation is ignored.
 */
export const IGNORED = 'Ignored';

/**
 * Maps the presence status values to i18n translation keys.
 *
 * @type {Object<String, String>}
 */
export const STATUS_TO_I18N_KEY = {
    'Invited': 'presenceStatus.invited',
    'Ringing': 'presenceStatus.ringing',
    'Calling': 'presenceStatus.calling',
    'Connected': 'presenceStatus.connected',
    'Connecting': 'presenceStatus.connecting',
    'Busy': 'presenceStatus.busy',
    'Rejected': 'presenceStatus.rejected',
    'Ignored': 'presenceStatus.ignored'
};

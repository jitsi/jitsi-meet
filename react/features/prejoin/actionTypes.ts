
/**
 * Action type to signal that joining is in progress.
 */
export const PREJOIN_JOINING_IN_PROGRESS = 'PREJOIN_JOINING_IN_PROGRESS';

/**
 * Action type to signal that prejoin page was initialized.
 */
export const PREJOIN_INITIALIZED = 'PREJOIN_INITIALIZED';

/**
 * Action type to set the status of the device.
 */
export const SET_DEVICE_STATUS = 'SET_DEVICE_STATUS';

/**
 * Action type to set the visibility of the prejoin page when client is forcefully reloaded.
 */
export const SET_SKIP_PREJOIN_RELOAD = 'SET_SKIP_PREJOIN_RELOAD';

/**
 * Action type to set the country to dial out to.
 */
export const SET_DIALOUT_COUNTRY = 'SET_DIALOUT_COUNTRY';

/**
 * Action type to set the dial out number.
 */
export const SET_DIALOUT_NUMBER = 'SET_DIALOUT_NUMBER';

/**
 * Action type to set the dial out status while dialing.
 */
export const SET_DIALOUT_STATUS = 'SET_DIALOUT_STATUS';

/**
 * Action type to set the visibility of the 'JoinByPhone' dialog.
 */
export const SET_JOIN_BY_PHONE_DIALOG_VISIBLITY = 'SET_JOIN_BY_PHONE_DIALOG_VISIBLITY';

/**
 * Action type to set the precall test data.
 */
export const SET_PRECALL_TEST_RESULTS = 'SET_PRECALL_TEST_RESULTS';

/**
 * Action type to disable the audio while on prejoin page.
 */
export const SET_PREJOIN_AUDIO_DISABLED = 'SET_PREJOIN_AUDIO_DISABLED';

/**
 * Action type to mute/unmute the audio while on prejoin page.
 */
export const SET_PREJOIN_AUDIO_MUTED = 'SET_PREJOIN_AUDIO_MUTED';

/**
 * Action type to set the errors while creating the prejoin streams.
 */
export const SET_PREJOIN_DEVICE_ERRORS = 'SET_PREJOIN_DEVICE_ERRORS';

/**
 * Action type to set the visibility of the prejoin page.
 */
export const SET_PREJOIN_PAGE_VISIBILITY = 'SET_PREJOIN_PAGE_VISIBILITY';

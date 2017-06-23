/**
 * The type of Redux action which signals that the currently used audio
 * input device should be changed.
 *
 * {
 *     type: SET_AUDIO_INPUT_DEVICE,
 *     deviceId: string,
 * }
 */
export const SET_AUDIO_INPUT_DEVICE = Symbol('SET_AUDIO_INPUT_DEVICE');

/**
 * The type of Redux action which signals that the currently used audio
 * output device should be changed.
 *
 * {
 *     type: SET_AUDIO_OUTPUT_DEVICE,
 *     deviceId: string,
 * }
 */
export const SET_AUDIO_OUTPUT_DEVICE = Symbol('SET_AUDIO_OUTPUT_DEVICE');

/**
 * The type of Redux action which signals that the currently used video
 * input device should be changed.
 *
 * {
 *     type: SET_VIDEO_INPUT_DEVICE,
 *     deviceId: string,
 * }
 */
export const SET_VIDEO_INPUT_DEVICE = Symbol('SET_VIDEO_INPUT_DEVICE');

/**
 * The type of Redux action which signals that the list of known available
 * audio and video sources has changed.
 *
 * {
 *     type: UPDATE_DEVICE_LIST,
 *     devices: Array<MediaDeviceInfo>,
 * }
 */
export const UPDATE_DEVICE_LIST = Symbol('UPDATE_DEVICE_LIST');

/**
 * The type of Redux action which signals that we need to show a device error.
 *
 * {
 *     type: SHOW_DEVICE_ERROR,
 *     micError: JitsiTrackError,
 *     cameraError: JitsiTrackError
 * }
 */
export const SHOW_DEVICE_ERROR = Symbol('SHOW_DEVICE_ERROR');

// @flow

export * from './functions.any';

/**
 * Returns the deviceId for the currently used camera.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function getCurrentCameraDeviceId(state: Object) {
    return state['features/base/settings'].cameraDeviceId;
}

/**
 * Returns the deviceId for the currently used microphone.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function getCurrentMicDeviceId(state: Object) {
    return state['features/base/settings'].micDeviceId;
}

/**
 * Returns the deviceId for the currently used speaker.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function getCurrentOutputDeviceId(state: Object) {
    return state['features/base/settings'].audioOutputDeviceId;
}

/**
 * Handles changes to the `disableCallIntegration` setting.
 * Noop on web.
 *
 * @param {boolean} disabled - Whether call integration is disabled or not.
 * @returns {void}
 */
export function handleCallIntegrationChange(disabled: boolean) { // eslint-disable-line no-unused-vars
}

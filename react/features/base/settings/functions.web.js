// @flow

export * from './functions.any';

/**
 * Returns the deviceId for the currently used camera.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function getCurrentCameraDeviceId(state: Object) {
    return getDeviceIdByType(state, 'isVideoTrack');
}

/**
 * Returns the deviceId for the currently used microphone.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function getCurrentMicDeviceId(state: Object) {
    return getDeviceIdByType(state, 'isAudioTrack');
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
 * Returns the deviceId for the corresponding local track type.
 *
 * @param {Object} state - The state of the application.
 * @param {string} isType - Can be 'isVideoTrack' | 'isAudioTrack'.
 * @returns {string}
 */
function getDeviceIdByType(state: Object, isType: string) {
    const [ deviceId ] = state['features/base/tracks']
          .map(t => t.jitsiTrack)
          .filter(t => t && t.isLocal() && t[isType]())
          .map(t => t.getDeviceId());

    return deviceId || '';
}

/**
 * Returns the saved display name.
 *
 * @param {Object} state - The state of the application.
 * @returns {string}
 */
export function getDisplayName(state: Object): string {
    return state['features/base/settings'].displayName || '';
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

/**
 * Handles changes to the `disableCrashReporting` setting.
 * Noop on web.
 *
 * @param {boolean} disabled - Whether crash reporting is disabled or not.
 * @returns {void}
 */
export function handleCrashReportingChange(disabled: boolean) { // eslint-disable-line no-unused-vars
}

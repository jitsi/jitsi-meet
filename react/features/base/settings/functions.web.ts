/* eslint-disable @typescript-eslint/no-unused-vars */
import { IReduxState } from '../../app/types';

export * from './functions.any';

/**
 * Returns the deviceId for the currently used camera.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function getCurrentCameraDeviceId(state: IReduxState) {
    return getDeviceIdByType(state, 'isVideoTrack');
}

/**
 * Returns the deviceId for the currently used microphone.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function getCurrentMicDeviceId(state: IReduxState) {
    return getDeviceIdByType(state, 'isAudioTrack');
}

/**
 * Returns the deviceId for the currently used speaker.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function getCurrentOutputDeviceId(state: IReduxState) {
    return state['features/base/settings'].audioOutputDeviceId;
}

/**
 * Returns the deviceId for the corresponding local track type.
 *
 * @param {Object} state - The state of the application.
 * @param {string} isType - Can be 'isVideoTrack' | 'isAudioTrack'.
 * @returns {string}
 */
function getDeviceIdByType(state: IReduxState, isType: string) {
    const [ deviceId ] = state['features/base/tracks']
        .map(t => t.jitsiTrack)
        .filter(t => t?.isLocal() && t[isType as keyof typeof t]())
        .map(t => t.getDeviceId());

    return deviceId || '';
}

/**
 * Returns the saved display name.
 *
 * @param {Object} state - The state of the application.
 * @returns {string}
 */
export function getDisplayName(state: IReduxState): string {
    return state['features/base/settings'].displayName || '';
}


/**
 * Handles changes to the `disableCallIntegration` setting.
 * Noop on web.
 *
 * @param {boolean} disabled - Whether call integration is disabled or not.
 * @returns {void}
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function, require-jsdoc
export function handleCallIntegrationChange(disabled: boolean) { }

/**
 * Handles changes to the `disableCrashReporting` setting.
 * Noop on web.
 *
 * @param {boolean} disabled - Whether crash reporting is disabled or not.
 * @returns {void}
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function, require-jsdoc
export function handleCrashReportingChange(disabled: boolean) { }

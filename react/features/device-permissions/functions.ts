import { IReduxState } from '../app/types';
import { isMacOS, isWindows } from '../base/environment/environment';
import { JitsiTrackErrors } from '../base/lib-jitsi-meet';

export type CaptureKind = 'audio' | 'video';

/**
 * Whether to guide the user through unblocking a device after a request for it was denied.
 *
 * @param {IReduxState} state - The redux state.
 * @param {CaptureKind} kind - The device.
 * @returns {boolean}
 */
export function shouldShowGuidance(state: IReduxState, kind: CaptureKind): boolean {
    return !state['features/base/config'].disablePermissionGuidanceDialog
        && state['features/base/devices'].permissionStatus?.[kind]?.state === 'denied';
}

/**
 * Whether a request for the devices failed because access to them was denied.
 *
 * @param {Object} [error] - The error of the request.
 * @returns {boolean}
 */
export function isPermissionDenied(error?: { name?: string; }): boolean {
    return error?.name === JitsiTrackErrors.PERMISSION_DENIED;
}

/**
 * Returns the URL of the OS privacy settings for a device, on macOS and Windows.
 *
 * @param {CaptureKind} kind - The device.
 * @returns {string|undefined}
 */
export function getSystemSettingsUrl(kind: CaptureKind): string | undefined {
    if (isMacOS()) {
        return `x-apple.systempreferences:com.apple.preference.security?Privacy_${
            kind === 'audio' ? 'Microphone' : 'Camera'}`;
    }
    if (isWindows()) {
        return kind === 'audio' ? 'ms-settings:privacy-microphone' : 'ms-settings:privacy-webcam';
    }
}

/**
 * Opens the OS privacy settings, the browser asks the user to confirm handing the link over to the OS.
 *
 * @param {string} url - One of the URLs from {@link getSystemSettingsUrl}.
 * @returns {void}
 */
export function openSystemSettings(url: string) {
    const link = document.createElement('a');

    link.href = url;
    link.click();
}

/**
 * Returns the devices, among the given ones, for which a request makes the browser show its permission prompt.
 *
 * @param {IReduxState} state - The redux state.
 * @param {CaptureKind[]} kinds - The devices to check.
 * @returns {CaptureKind[]}
 */
export function getKindsToPrompt(state: IReduxState, kinds: CaptureKind[]): CaptureKind[] {
    const { permissionStatus } = state['features/base/devices'];

    return kinds.filter(kind => permissionStatus?.[kind]?.state === 'prompt');
}

/**
 * Returns the browser's capability element for the given devices ({@code <microphone>}, {@code <camera>} or
 * {@code <usermedia>} for both), which shows the permission prompt next to the element and lets the user undo an
 * earlier block.
 *
 * @param {CaptureKind[]} kinds - The devices to ask for.
 * @returns {string|undefined} - The element's tag name, undefined when the browser doesn't support it.
 */
export function getCaptureElement(kinds: CaptureKind[]): 'camera' | 'microphone' | 'usermedia' | undefined {
    if (kinds.length > 1) {
        return 'HTMLUserMediaElement' in window ? 'usermedia' : undefined;
    }
    if (kinds[0] === 'audio') {
        return 'HTMLMicrophoneElement' in window ? 'microphone' : undefined;
    }

    return 'HTMLCameraElement' in window ? 'camera' : undefined;
}

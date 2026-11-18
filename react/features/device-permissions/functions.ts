import { IReduxState } from '../app/types';
import { IPermissionStatus } from '../base/devices/types';
import { isMacOS, isWindows } from '../base/environment/environment';
import JitsiMeetJS, { JitsiTrackErrors, browser } from '../base/lib-jitsi-meet';

export type CaptureKind = 'audio' | 'video';

/**
 * The guide for unblocking the devices: the OS settings, the browser's site settings, or none when the page's
 * permissions policy blocks them.
 */
export type BlockedGuide = 'browserChromium' | 'browserFirefox' | 'browserSafari' | 'osMac' | 'osOther' | 'osWindows'
    | 'policy';

/**
 * Returns the guide for what blocks the devices. The permissions policy goes first since nothing the user changes
 * helps while it blocks a device, then the OS.
 *
 * @param {Array} reasons - Why the devices were denied.
 * @returns {BlockedGuide}
 */
export function getBlockedGuide(reasons: Array<IPermissionStatus['reason']>): BlockedGuide {
    if (reasons.includes('policy')) {
        return 'policy';
    }
    if (reasons.includes('os')) {
        if (isMacOS()) {
            return 'osMac';
        }

        return isWindows() ? 'osWindows' : 'osOther';
    }
    if (browser.isFirefox()) {
        return 'browserFirefox';
    }

    return browser.isSafari() ? 'browserSafari' : 'browserChromium';
}

/**
 * Returns the names of the browser, as shown in the macOS privacy settings and in text.
 *
 * @returns {Object|undefined} - Undefined for a browser that isn't known, e.g. an Electron app.
 */
export function getBrowserNames(): { app: string; name: string; } | undefined {
    if (browser.isFirefox()) {
        return {
            app: 'Firefox',
            name: 'Firefox'
        };
    }
    if (browser.isSafari()) {
        return {
            app: 'Safari',
            name: 'Safari'
        };
    }
    if (!browser.isChromiumBased() || browser.isElectron()) {
        return;
    }

    const { userAgent } = navigator;

    if (userAgent.includes('Edg/')) {
        return {
            app: 'Microsoft Edge',
            name: 'Edge'
        };
    }
    if (userAgent.includes('OPR/')) {
        return {
            app: 'Opera',
            name: 'Opera'
        };
    }
    if ('brave' in navigator) {
        return {
            app: 'Brave Browser',
            name: 'Brave'
        };
    }

    return {
        app: 'Google Chrome',
        name: 'Chrome'
    };
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

/**
 * Returns the suffix of the translation keys for the given devices.
 *
 * @param {CaptureKind[]} kinds - The devices.
 * @returns {string}
 */
export function getKeySuffix(kinds: CaptureKind[]): 'Audio' | 'Both' | 'Video' {
    if (kinds.length > 1) {
        return 'Both';
    }

    return kinds[0] === 'audio' ? 'Audio' : 'Video';
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
 * Whether a request for the devices failed because access to them was denied.
 *
 * @param {Object} [error] - The error of the request.
 * @returns {boolean}
 */
export function isPermissionDenied(error?: { name?: string; }): boolean {
    return error?.name === JitsiTrackErrors.PERMISSION_DENIED;
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
 * Asks for access to the devices without keeping them. A denial shows in the permission status, other failures
 * are dropped.
 *
 * @param {CaptureKind[]} kinds - The devices.
 * @returns {Promise<void>}
 */
export function requestAccess(kinds: CaptureKind[]): Promise<void> {
    return JitsiMeetJS.createLocalTracks({ devices: kinds })
        .then((tracks: any[]) => tracks.forEach(track => track.dispose()))
        .catch(() => {
            // Nothing to keep.
        });
}

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

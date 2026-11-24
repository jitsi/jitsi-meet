import { IReduxState } from '../app/types';
import { isMacOS, isWindows } from '../base/environment/environment';
import { isMobileBrowser } from '../base/environment/utils';
import { browser } from '../base/lib-jitsi-meet';
import { getLocalDesktopTrack } from '../base/tracks/functions';

import logger from './logger';

// macOS 14.2 has the CoreAudio Tap API; Electron 43.4 can leave its own playback out of the capture.
const MIN_ELECTRON_VERSION_FOR_MACOS_AUDIO = [ 43, 4 ];
const MIN_MACOS_VERSION_FOR_AUDIO = [ 14, 2 ];

// The macOS version split into numbers, read on first use. The user agent string always reports 10.15.7.
let macOSVersion: number[] | undefined;
let macOSVersionLookup: Promise<void> | undefined;

/**
 * Returns the macOS version, starting its lookup on the first call. It returns undefined until the lookup has
 * finished, or if it failed.
 *
 * @returns {number[] | undefined}
 */
function getMacOSVersion() {
    if (!macOSVersionLookup) {
        const { userAgentData } = navigator as unknown as {
            userAgentData?: {
                getHighEntropyValues: (hints: string[]) => Promise<{ platformVersion?: string; }>;
            };
        };

        macOSVersionLookup = userAgentData
            ? userAgentData.getHighEntropyValues([ 'platformVersion' ])
                .then(({ platformVersion }) => {
                    macOSVersion = platformVersion?.split('.').map(Number);
                    logger.info(`macOS version: ${platformVersion}`);
                })
                .catch((error: Error) => logger.warn('Failed to read the macOS version', error))
            : Promise.resolve();
    }

    return macOSVersion;
}

/**
 * Returns whether a version is the given [major, minor] or later.
 *
 * @param {number[]} version - The version as numbers.
 * @param {number[]} minVersion - The minimum version as [major, minor].
 * @returns {boolean}
 */
function isVersionAtLeast([ major = 0, minor = 0 ]: number[], [ minMajor, minMinor ]: number[]) {
    return major > minMajor || (major === minMajor && minor >= minMinor);
}

/**
 * Returns whether the Electron app can share system audio. It is supported on Windows, and on macOS 14.2 or
 * later with Electron 43.4 or later when the host app has declared it with {@code desktopSharingMacOSSystemAudio}.
 * On macOS it returns false until the macOS version has been read.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isElectronSystemAudioSupported(state: IReduxState) {
    if (!browser.isElectron()) {
        return false;
    }

    if (isWindows()) {
        return true;
    }

    // Without NSAudioCaptureUsageDescription in the host's Info.plist macOS hands out a silent track, so the host
    // has to say it has the key.
    if (!isMacOS()
            || !state['features/base/config'].desktopSharingMacOSSystemAudio
            || !isVersionAtLeast((browser.getVersion() ?? '').split('.').map(Number), MIN_ELECTRON_VERSION_FOR_MACOS_AUDIO)) {
        return false;
    }

    const version = getMacOSVersion();

    return Boolean(version) && isVersionAtLeast(version as number[], MIN_MACOS_VERSION_FOR_AUDIO);
}

/**
 * Returns whether the Electron desktop picker offers to share system audio with a source of the given type.
 *
 * @param {IReduxState} state - The state of the application.
 * @param {string} type - The desktop source type, 'screen' or 'window'.
 * @returns {boolean}
 */
export function isSystemAudioOfferedFor(state: IReduxState, type: string) {
    // A Windows window capture carries no system audio. The macOS loopback is the whole system's, so it goes
    // with a window as well.
    if (isWindows()) {
        return type === 'screen';
    }

    return (type === 'screen' || type === 'window') && isElectronSystemAudioSupported(state);
}

/**
 * Is the current screen sharing session audio only.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isAudioOnlySharing(state: IReduxState) {
    return isScreenAudioShared(state) && !isScreenVideoShared(state);
}

/**
 * State of audio sharing.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isScreenAudioShared(state: IReduxState) {
    return state['features/screen-share'].isSharingAudio;
}

/**
 * Returns the visibility of the audio only screen share button. Currently only Chromium based desktop browsers
 * and the Electron app where it can share system audio support this functionality.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isScreenAudioSupported(state: IReduxState) {
    return (!isMobileBrowser() && browser.isChromiumBased() && !browser.isElectron())
        || isElectronSystemAudioSupported(state);
}

/**
 * Is any screen media currently being shared, audio or video.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isScreenMediaShared(state: IReduxState) {
    return isScreenAudioShared(state) || isScreenVideoShared(state);
}

/**
 * Is screen sharing currently active.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isScreenVideoShared(state: IReduxState) {
    const tracks = state['features/base/tracks'];
    const localScreenshare = getLocalDesktopTrack(tracks);

    return localScreenshare?.jitsiTrack && !localScreenshare.jitsiTrack.isMuted();
}

import { browser } from '../base/lib-jitsi-meet';

/**
 * Returns true if Jitsi Meet is running in too old jitsi-meet-electron app and false otherwise.
 *
 * @returns {boolean} - True if Jitsi Meet is running in too old jitsi-meet-electron app and false otherwise.
 */
export function isOldJitsiMeetElectronApp() {
    if (!browser.isElectron()) {
        return false;
    }

    // @ts-ignore
    const match = navigator.userAgent.match(/(JitsiMeet)\s*\/\s*((\d+)\.[^\s]*)/);

    if (!Array.isArray(match) || match.length < 3) {
        return false;
    }

    const majorVersion = Number(match[3]);

    if (isNaN(majorVersion) || majorVersion >= 2022) {
        return false;
    }

    return true;
}

import { IReduxState } from '../../app/types';
import JitsiMeetJS from '../../base/lib-jitsi-meet';

import {
    IConfig,
    IDeeplinkingConfig,
    IDeeplinkingDesktopConfig,
    IDeeplinkingMobileConfig
} from './configType';

export * from './functions.any';

/**
 * Removes all analytics related options from the given configuration, in case of a libre build.
 *
 * @param {*} _config - The configuration which needs to be cleaned up.
 * @returns {void}
 */
export function _cleanupConfig(_config: IConfig) {
    return;
}

/**
 * Returns the replaceParticipant config.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function getReplaceParticipant(state: IReduxState): string | undefined {
    return state['features/base/config'].replaceParticipant;
}

/**
 * Returns the configuration value of web-hid feature.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean} True if web-hid feature should be enabled, otherwise false.
 */
export function getWebHIDFeatureConfig(state: IReduxState): boolean {
    return state['features/base/config'].enableWebHIDFeature || false;
}

/**
 * Returns whether audio level measurement is enabled or not.
 *
 * @param {Object} state - The state of the app.
 * @returns {boolean}
 */
export function areAudioLevelsEnabled(state: IReduxState): boolean {
    return !state['features/base/config'].disableAudioLevels && JitsiMeetJS.isCollectingLocalStats();
}

/**
 * Sets the defaults for deeplinking.
 *
 * @param {IDeeplinkingConfig} deeplinking - The deeplinking config.
 * @returns {void}
 */
export function _setDeeplinkingDefaults(deeplinking: IDeeplinkingConfig) {
    deeplinking.desktop = deeplinking.desktop || {} as IDeeplinkingDesktopConfig;
    deeplinking.android = deeplinking.android || {} as IDeeplinkingMobileConfig;
    deeplinking.ios = deeplinking.ios || {} as IDeeplinkingMobileConfig;

    const { android, desktop, ios } = deeplinking;

    desktop.appName = desktop.appName || 'Jitsi Meet';
    desktop.appScheme = desktop.appScheme || 'jitsi-meet';
    desktop.download = desktop.download || {};
    desktop.download.windows = desktop.download.windows
        || 'https://github.com/jitsi/jitsi-meet-electron/releases/latest/download/jitsi-meet.exe';
    desktop.download.macos = desktop.download.macos
        || 'https://github.com/jitsi/jitsi-meet-electron/releases/latest/download/jitsi-meet.dmg';
    desktop.download.linux = desktop.download.linux
        || 'https://github.com/jitsi/jitsi-meet-electron/releases/latest/download/jitsi-meet-x86_64.AppImage';

    ios.appName = ios.appName || 'Jitsi Meet';
    ios.appScheme = ios.appScheme || 'org.jitsi.meet';
    ios.downloadLink = ios.downloadLink
        || 'https://itunes.apple.com/us/app/jitsi-meet/id1165103905';
    if (ios.dynamicLink) {
        ios.dynamicLink.apn = ios.dynamicLink.apn || 'org.jitsi.meet';
        ios.dynamicLink.appCode = ios.dynamicLink.appCode || 'w2atb';
        ios.dynamicLink.ibi = ios.dynamicLink.ibi || 'com.atlassian.JitsiMeet.ios';
        ios.dynamicLink.isi = ios.dynamicLink.isi || '1165103905';
    }

    android.appName = android.appName || 'Jitsi Meet';
    android.appScheme = android.appScheme || 'org.jitsi.meet';
    android.downloadLink = android.downloadLink
        || 'https://play.google.com/store/apps/details?id=org.jitsi.meet';
    android.appPackage = android.appPackage || 'org.jitsi.meet';
    android.fDroidUrl = android.fDroidUrl || 'https://f-droid.org/packages/org.jitsi.meet/';
    if (android.dynamicLink) {
        android.dynamicLink.apn = android.dynamicLink.apn || 'org.jitsi.meet';
        android.dynamicLink.appCode = android.dynamicLink.appCode || 'w2atb';
        android.dynamicLink.ibi = android.dynamicLink.ibi || 'com.atlassian.JitsiMeet.ios';
        android.dynamicLink.isi = android.dynamicLink.isi || '1165103905';
    }
}

import { IReduxState } from '../../app/types';
import JitsiMeetJS from '../../base/lib-jitsi-meet';
import { NOTIFY_CLICK_MODE } from '../../toolbox/constants';

import {
    IConfig,
    IDeeplinkingConfig,
    IDeeplinkingDesktopConfig,
    IDeeplinkingMobileConfig,
    NotifyClickButton,
    ToolbarButton
} from './configType';
import { TOOLBAR_BUTTONS } from './constants';

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
 * Returns the list of enabled toolbar buttons.
 *
 * @param {Object} state - The redux state.
 * @returns {Array<string>} - The list of enabled toolbar buttons.
 */
export function getToolbarButtons(state: IReduxState): Array<string> {
    const { toolbarButtons, customToolbarButtons } = state['features/base/config'];
    const customButtons = customToolbarButtons?.map(({ id }) => id);

    const buttons = Array.isArray(toolbarButtons) ? toolbarButtons : TOOLBAR_BUTTONS;

    if (customButtons) {
        buttons.push(...customButtons as ToolbarButton[]);
    }

    return buttons;
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
 * Checks if the specified button is enabled.
 *
 * @param {string} buttonName - The name of the button.
 * {@link interfaceConfig}.
 * @param {Object|Array<string>} state - The redux state or the array with the enabled buttons.
 * @returns {boolean} - True if the button is enabled and false otherwise.
 */
export function isToolbarButtonEnabled(buttonName: string, state: IReduxState | Array<string>) {
    const buttons = Array.isArray(state) ? state : getToolbarButtons(state);

    return buttons.includes(buttonName);
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
    android.fDroidUrl = android.fDroidUrl || 'https://f-droid.org/en/packages/org.jitsi.meet/';
    if (android.dynamicLink) {
        android.dynamicLink.apn = android.dynamicLink.apn || 'org.jitsi.meet';
        android.dynamicLink.appCode = android.dynamicLink.appCode || 'w2atb';
        android.dynamicLink.ibi = android.dynamicLink.ibi || 'com.atlassian.JitsiMeet.ios';
        android.dynamicLink.isi = android.dynamicLink.isi || '1165103905';
    }
}

/**
 * Common logic to gather buttons that have to notify the api when clicked.
 *
 * @param {Array} buttonsWithNotifyClick - The array of systme buttons that need to notify the api.
 * @param {Array} customButtons - The custom buttons.
 * @returns {Array}
 */
const buildButtonsArray = (
        buttonsWithNotifyClick?: NotifyClickButton[],
        customButtons?: {
            icon: string;
            id: string;
            text: string;
        }[]
): NotifyClickButton[] => {
    const customButtonsWithNotifyClick = customButtons?.map(({ id }) => {
        return {
            key: id,
            preventExecution: false
        };
    });

    const buttons = Array.isArray(buttonsWithNotifyClick)
        ? buttonsWithNotifyClick as NotifyClickButton[]
        : [];

    if (customButtonsWithNotifyClick) {
        buttons.push(...customButtonsWithNotifyClick);
    }

    return buttons;
};

/**
 * Returns the list of toolbar buttons that have to notify the api when clicked.
 *
 * @param {Object} state - The redux state.
 * @returns {Array} - The list of buttons.
 */
export function getButtonsWithNotifyClick(
        state: IReduxState
): NotifyClickButton[] {
    const { buttonsWithNotifyClick, customToolbarButtons } = state['features/base/config'];

    return buildButtonsArray(
        buttonsWithNotifyClick,
        customToolbarButtons
    );
}

/**
 * Returns the list of participant menu buttons that have that notify the api when clicked.
 *
 * @param {Object} state - The redux state.
 * @returns {Array} - The list of participant menu buttons.
 */
export function getParticipantMenuButtonsWithNotifyClick(
        state: IReduxState
): NotifyClickButton[] {
    const { participantMenuButtonsWithNotifyClick, customParticipantMenuButtons } = state['features/base/config'];

    return buildButtonsArray(
        participantMenuButtonsWithNotifyClick,
        customParticipantMenuButtons
    );
}

/**
 * Returns the notify mode for the specified button.
 *
 * @param {string} buttonKey - The button key.
 * @param {Array} buttonsWithNotifyClick - The buttons with notify click.
 * @returns {string|undefined}
 */
export const getButtonNotifyMode = (
        buttonKey: string,
        buttonsWithNotifyClick?: NotifyClickButton[]
): string | undefined => {
    const notify = buttonsWithNotifyClick?.find(
        (btn: NotifyClickButton) =>
            (typeof btn === 'string' && btn === buttonKey) || (typeof btn === 'object' && btn.key === buttonKey)
    );

    if (notify) {
        return typeof notify === 'string' || notify.preventExecution
            ? NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
            : NOTIFY_CLICK_MODE.ONLY_NOTIFY;
    }
};

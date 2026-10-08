import { merge } from 'lodash-es';

import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { IConfig } from '../base/config/configType';
import { browser } from '../base/lib-jitsi-meet';
import { createLocalTrack } from '../base/lib-jitsi-meet/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { getUserSelectedCameraDeviceId } from '../base/settings/functions.web';
import {
    areCtrlAltReactionShortcutsEnabled,
    areKeyboardShortcutsEnabled,
    getKeyboardShortcutsHelpDescriptions
} from '../keyboard-shortcuts/functions';
import { getParticipantsPaneConfig } from '../participants-pane/functions';
import { isPrejoinPageVisible } from '../prejoin/functions';

import { CONFIG_OPTIONS } from './configOptions';
import { ConfigOption } from './types';

export * from './functions.any';

/**
 * Returns a promise which resolves with a list of objects containing
 * all the video jitsiTracks and appropriate errors for the given device ids.
 *
 * @param {string[]} ids - The list of the camera ids for which to create tracks.
 * @param {number} [timeout] - A timeout for the createLocalTrack function call.
 *
 * @returns {Promise<Object[]>}
 */
export function createLocalVideoTracks(ids: string[], timeout?: number) {
    return Promise.all(ids.map(deviceId => createLocalTrack('video', deviceId, timeout)
                    .then((jitsiTrack: any) => {
                        return {
                            jitsiTrack,
                            deviceId
                        };
                    })
                    .catch(() => {
                        return {
                            jitsiTrack: null,
                            deviceId,
                            error: 'deviceSelection.previewUnavailable'
                        };
                    })));
}


/**
 * Returns a promise which resolves with a list of objects containing
 * the audio track and the corresponding audio device information.
 *
 * @param {Object[]} devices - A list of microphone devices.
 * @param {number} [timeout] - A timeout for the createLocalTrack function call.
 * @returns {Promise<{
 *   deviceId: string,
 *   hasError: boolean,
 *   jitsiTrack: Object,
 *   label: string
 * }[]>}
 */
export function createLocalAudioTracks(devices: Array<{ deviceId: string; label: string; }>, timeout?: number) {
    return Promise.all(
        devices.map(async ({ deviceId, label }) => {
            let jitsiTrack = null;
            let hasError = false;

            try {
                jitsiTrack = await createLocalTrack('audio', deviceId, timeout);
            } catch (err) {
                hasError = true;
            }

            return {
                deviceId,
                hasError,
                jitsiTrack,
                label
            };
        }));
}

/**
 * Returns the properties for the "Shortcuts" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @param {boolean} isDisplayedOnWelcomePage - Indicates whether the shortcuts dialog is displayed on the
 * welcome page or not.
 * @returns {Object} - The properties for the "Shortcuts" tab from settings
 * dialog.
 */
export function getShortcutsTabProps(stateful: IStateful, isDisplayedOnWelcomePage?: boolean) {
    const state = toState(stateful);

    return {
        ctrlAltReactionShortcutsEnabled: areCtrlAltReactionShortcutsEnabled(state),
        displayShortcuts: !isDisplayedOnWelcomePage && !isPrejoinPageVisible(state),
        keyboardShortcutsEnabled: areKeyboardShortcutsEnabled(state),
        keyboardShortcutsHelpDescriptions: getKeyboardShortcutsHelpDescriptions(state),
        showCtrlAltReactionShortcuts: browser.isFirefox()
    };
}

/**
 * Returns the properties for the "Virtual Background" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @param {boolean} isDisplayedOnWelcomePage - Indicates whether the device selection dialog is displayed on the
 * welcome page or not.
 * @returns {Object} - The properties for the "Shortcuts" tab from settings
 * dialog.
 */
export function getVirtualBackgroundTabProps(stateful: IStateful, isDisplayedOnWelcomePage?: boolean) {
    const state = toState(stateful);
    const settings = state['features/base/settings'];
    const userSelectedCamera = getUserSelectedCameraDeviceId(state);
    let selectedVideoInputId = settings.cameraDeviceId;

    if (isDisplayedOnWelcomePage) {
        selectedVideoInputId = userSelectedCamera;
    }

    return {
        options: state['features/virtual-background'],
        selectedVideoInputId
    };
}

/**
 * Returns the ids of the config options the deployment does not let users decide, read from the given config. Such
 * an option is neither displayed nor is a value the user chose for it earlier applied, so the deployment's value
 * stands.
 *
 * @param {IConfig} config - The config to read the list from.
 * @returns {string[]} - The ids of the disabled config options.
 */
export function getDisabledExperimentalTabOptionIds(config: IConfig): string[] {
    return config.settingsDialog?.disabledExperimentalTabOptions ?? [];
}

/**
 * Returns the config values the user has chosen as a partial config, ready to be merged into the config. A value is
 * applied whether or not its option applies to the current environment, since a feature that cannot work here
 * ignores its flag anyway; only options the deployment disabled are left out.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string[]} disabledIds - The ids of the options the deployment disabled. Defaults to the list of the current
 * config; the settings middleware passes the list of the config about to be set instead.
 * @returns {IConfig} - The config values chosen by the user.
 */
export function getUserSelectedConfig(
        state: IReduxState,
        disabledIds: string[] = getDisabledExperimentalTabOptionIds(state['features/base/config'])): IConfig {
    const { userSelectedConfig = {} } = state['features/base/settings'];
    const config: IConfig = {};

    for (const option of CONFIG_OPTIONS.filter(({ id }) => !disabledIds.includes(id))) {
        const configPart = _toConfigPart(option, userSelectedConfig[option.id]);

        // Merged deeply because several options may live in the same config section (e.g. pip).
        if (configPart) {
            merge(config, configPart);
        }
    }

    return config;
}

/**
 * Returns the partial config that applies a value persisted for a config option, or undefined if the value does not
 * suit the option. The value comes from the browser's local storage, where an older version of the option or a hand
 * edit may have left anything, so every kind of option checks it before applying it.
 *
 * @param {ConfigOption} option - The config option.
 * @param {unknown} value - The value persisted for the option.
 * @private
 * @returns {IConfig|undefined} - The partial config that applies the value.
 */
function _toConfigPart(option: ConfigOption, value: unknown): IConfig | undefined {
    // Only on/off options exist for now. The switch is deliberate: a new kind of value adds its own case here, which
    // checks the persisted value and lets TypeScript know which type of value that kind's toConfig() takes.
    switch (option.type) {
    case 'boolean':
        return typeof value === 'boolean' ? option.toConfig(value) : undefined;
    }
}

/**
 * Used for web. Indicates if the setting section is enabled.
 *
 * @param {string} settingName - The name of the setting section as defined in
 * interface_config.js and SettingsMenu.js.
 * @returns {boolean} True to indicate that the given setting section
 * is enabled, false otherwise.
 */
export function isSettingEnabled(settingName: string) {
    return interfaceConfig.SETTINGS_SECTIONS.includes(settingName);
}


/**
 * Returns true if moderator tab in settings should be visible/accessible.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {boolean} True to indicate that moderator tab should be visible, false otherwise.
 */
export function shouldShowModeratorSettings(stateful: IStateful) {
    const state = toState(stateful);
    const { hideModeratorSettingsTab } = getParticipantsPaneConfig(state);
    const hasModeratorRights = Boolean(isSettingEnabled('moderator') && isLocalParticipantModerator(state));

    return hasModeratorRights && !hideModeratorSettingsTab;
}

/**
 * Disposes a track.
 *
 * @param {Object} track - The track to dispose.
 * @returns {Promise<void>}
 */
export async function disposeTrack(track: any) {
    if (!track) {
        return;
    }

    await track.dispose();
}

/**
 * Disposes the audio input preview track from Redux state.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Promise<void>}
 */
export async function disposePreviewAudioTrack(stateful: IStateful) {
    const state = toState(stateful);
    const previewTrack = state['features/settings']?.previewAudioTrack;

    await disposeTrack(previewTrack);
}

import { IStateful } from '../base/app/types';
import { createLocalTrack } from '../base/lib-jitsi-meet/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { getUserSelectedCameraDeviceId } from '../base/settings/functions.web';
import { areKeyboardShortcutsEnabled, getKeyboardShortcutsHelpDescriptions } from '../keyboard-shortcuts/functions';
import { getParticipantsPaneConfig } from '../participants-pane/functions';
import { isPrejoinPageVisible } from '../prejoin/functions';

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
        displayShortcuts: !isDisplayedOnWelcomePage && !isPrejoinPageVisible(state),
        keyboardShortcutsEnabled: areKeyboardShortcutsEnabled(state),
        keyboardShortcutsHelpDescriptions: getKeyboardShortcutsHelpDescriptions(state)
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

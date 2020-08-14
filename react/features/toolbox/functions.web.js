// @flow

import { hasAvailableDevices } from '../base/devices';
import { isMobileBrowser } from '../base/environment/utils';

declare var interfaceConfig: Object;

/**
 * Helper for getting the height of the toolbox.
 *
 * @returns {number} The height of the toolbox.
 */
export function getToolboxHeight() {
    const toolbox = document.getElementById('new-toolbox');

    return (toolbox && toolbox.clientHeight) || 0;
}

/**
 * Indicates if a toolbar button is enabled.
 *
 * @param {string} name - The name of the setting section as defined in
 * interface_config.js.
 * @returns {boolean|undefined} - True to indicate that the given toolbar button
 * is enabled, false - otherwise. In cases where interfaceConfig is not available
 * undefined is returned.
 */
export function isButtonEnabled(name: string) {
    if (typeof interfaceConfig === 'object' && Array.isArray(interfaceConfig.TOOLBAR_BUTTONS)) {
        return interfaceConfig.TOOLBAR_BUTTONS.indexOf(name) !== -1;
    }

    return undefined;
}


/**
 * Indicates if the toolbox is visible or not.
 *
 * @param {string} state - The state from the Redux store.
 * @returns {boolean} - True to indicate that the toolbox is visible, false -
 * otherwise.
 */
export function isToolboxVisible(state: Object) {
    const { iAmSipGateway } = state['features/base/config'];
    const {
        alwaysVisible,
        timeoutID,
        visible
    } = state['features/toolbox'];
    const { audioSettingsVisible, videoSettingsVisible } = state['features/settings'];
    const { isOpen } = state['features/chat'];
    const isMobileChatOpen = isMobileBrowser() && isOpen;

    return Boolean(!isMobileChatOpen && !iAmSipGateway && (timeoutID || visible || alwaysVisible
                                      || audioSettingsVisible || videoSettingsVisible));
}

/**
 * Indicates if the audio settings button is disabled or not.
 *
 * @param {string} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isAudioSettingsButtonDisabled(state: Object) {
    return (!hasAvailableDevices(state, 'audioInput')
          && !hasAvailableDevices(state, 'audioOutput'))
          || state['features/base/config'].startSilent;
}

/**
 * Indicates if the video settings button is disabled or not.
 *
 * @param {string} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoSettingsButtonDisabled(state: Object) {
    return !hasAvailableDevices(state, 'videoInput');
}

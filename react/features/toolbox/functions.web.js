// @flow

import { getToolbarButtons } from '../base/config';
import { hasAvailableDevices } from '../base/devices';

const WIDTH = {
    FIT_9_ICONS: 520,
    FIT_8_ICONS: 470,
    FIT_7_ICONS: 420,
    FIT_6_ICONS: 370,
    FIT_5_ICONS: 320,
    FIT_4_ICONS: 280
};

/**
 * Returns a set of button names to be displayed in the toolbox, based on the screen width and platform.
 *
 * @param {number} width - The width of the screen.
 * @param {number} isMobile - The device is a mobile one.
 * @returns {Set} The button set.
 */
export function getToolbarAdditionalButtons(width: number, isMobile: boolean): Set<string> {
    let buttons = [];

    switch (true) {
    case width >= WIDTH.FIT_9_ICONS: {
        buttons = isMobile
            ? [ 'chat', 'raisehand', 'tileview', 'participants-pane', 'overflow' ]
            : [ 'desktop', 'chat', 'raisehand', 'tileview', 'participants-pane', 'overflow' ];
        break;
    }

    case width >= WIDTH.FIT_8_ICONS: {
        buttons = [ 'desktop', 'chat', 'raisehand', 'participants-pane', 'overflow' ];
        break;
    }

    case width >= WIDTH.FIT_7_ICONS: {
        buttons = [ 'desktop', 'chat', 'participants-pane', 'overflow' ];
        break;
    }

    case width >= WIDTH.FIT_6_ICONS: {
        buttons = [ 'chat', 'participants-pane', 'overflow' ];
        break;
    }

    case width >= WIDTH.FIT_5_ICONS: {
        buttons = [ 'chat', 'overflow' ];
        break;
    }

    case width >= WIDTH.FIT_4_ICONS: {
        buttons = isMobile
            ? [ 'chat', 'overflow' ]
            : [ 'overflow' ];
        break;
    }

    default: {
        buttons = isMobile
            ? [ 'chat', 'overflow' ]
            : [];
    }
    }

    return new Set(buttons);
}

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
 * @param {Object} state - The redux state.
 * @returns {boolean|undefined} - True to indicate that the given toolbar button
 * is enabled, false - otherwise.
 */
export function isButtonEnabled(name: string, state: Object) {
    const toolbarButtons = getToolbarButtons(state);

    return toolbarButtons.indexOf(name) !== -1;
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

    return Boolean(!iAmSipGateway && (timeoutID || visible || alwaysVisible
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

/**
 * Indicates if the video mute button is disabled or not.
 *
 * @param {string} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoMuteButtonDisabled(state: Object) {
    return !hasAvailableDevices(state, 'videoInput');
}

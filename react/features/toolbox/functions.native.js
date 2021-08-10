// @flow

import { hasAvailableDevices } from '../base/devices';
import { TOOLBOX_ALWAYS_VISIBLE, getFeatureFlag, TOOLBOX_ENABLED } from '../base/flags';
import { getParticipantCountWithFake } from '../base/participants';
import { toState } from '../base/redux';
import { isLocalVideoTrackDesktop } from '../base/tracks';

const WIDTH = {
    FIT_9_ICONS: 560,
    FIT_8_ICONS: 500,
    FIT_7_ICONS: 440,
    FIT_6_ICONS: 380
};

/**
 * Returns a set of the buttons that are shown in the toolbar
 * but removed from the overflow menu, based on the width of the screen.
 *
 * @param {number} width - The width of the screen.
 * @returns {Set}
 */
export function getMovableButtons(width: number): Set<string> {
    let buttons = [];

    switch (true) {
    case width >= WIDTH.FIT_9_ICONS: {
        buttons = [ 'togglecamera', 'chat', 'participantspane', 'raisehand', 'tileview' ];
        break;
    }
    case width >= WIDTH.FIT_8_ICONS: {
        buttons = [ 'chat', 'togglecamera', 'raisehand', 'tileview' ];
        break;
    }

    case width >= WIDTH.FIT_7_ICONS: {
        buttons = [ 'chat', 'togglecamera', 'raisehand' ];
        break;
    }

    case width >= WIDTH.FIT_6_ICONS: {
        buttons = [ 'chat', 'togglecamera' ];
        break;
    }

    default: {
        buttons = [ 'chat' ];
    }
    }

    return new Set(buttons);
}

/**
 * Returns true if the toolbox is visible.
 *
 * @param {Object | Function} stateful - A function or object that can be
 * resolved to Redux state by the function {@code toState}.
 * @returns {boolean}
 */
export function isToolboxVisible(stateful: Object | Function) {
    const state = toState(stateful);
    const { alwaysVisible, enabled, visible } = state['features/toolbox'];
    const participantCount = getParticipantCountWithFake(state);
    const alwaysVisibleFlag = getFeatureFlag(state, TOOLBOX_ALWAYS_VISIBLE, false);
    const enabledFlag = getFeatureFlag(state, TOOLBOX_ENABLED, true);

    return enabledFlag && enabled && (alwaysVisible || visible || participantCount === 1 || alwaysVisibleFlag);
}

/**
 * Indicates if the video mute button is disabled or not.
 *
 * @param {string} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isVideoMuteButtonDisabled(state: Object) {
    return !hasAvailableDevices(state, 'videoInput') || isLocalVideoTrackDesktop(state);
}

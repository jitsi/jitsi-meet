// @flow

import { hasAvailableDevices } from '../base/devices';
import { TOOLBOX_ALWAYS_VISIBLE, getFeatureFlag } from '../base/flags';
import { toState } from '../base/redux';
import { isLocalVideoTrackDesktop } from '../base/tracks';

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
    const { length: participantCount } = state['features/base/participants'];
    const flag = getFeatureFlag(state, TOOLBOX_ALWAYS_VISIBLE, false);

    return enabled && (alwaysVisible || visible || participantCount === 1 || flag);
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

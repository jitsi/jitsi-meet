// @ts-expect-error
import UIEvents from '../../../service/UI/UIEvents';
import { VIDEO_MUTE, createToolbarEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { setAudioOnly } from '../base/audio-only/actions';
import { setVideoMuted } from '../base/media/actions';
import { VIDEO_MUTISM_AUTHORITY } from '../base/media/constants';

import {
    SET_TOOLBOX_ENABLED,
    SET_TOOLBOX_SHIFT_UP,
    SET_TOOLBOX_VISIBLE,
    TOGGLE_TOOLBOX_VISIBLE
} from './actionTypes';

/**
 * Enables/disables the toolbox.
 *
 * @param {boolean} enabled - True to enable the toolbox or false to disable it.
 * @returns {{
 *     type: SET_TOOLBOX_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setToolboxEnabled(enabled: boolean) {
    return {
        type: SET_TOOLBOX_ENABLED,
        enabled
    };
}

/**
 * Shows/hides the toolbox.
 *
 * @param {boolean} visible - True to show the toolbox or false to hide it.
 * @returns {Function}
 */
export function setToolboxVisible(visible: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { toolbarConfig } = getState()['features/base/config'];
        const alwaysVisible = toolbarConfig?.alwaysVisible;

        if (!visible && alwaysVisible) {
            return;
        }

        dispatch({
            type: SET_TOOLBOX_VISIBLE,
            visible
        });
    };
}

/**
 * Action to toggle the toolbox visibility.
 *
 * @returns {Function}
 */
export function toggleToolboxVisible() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { toolbarConfig } = getState()['features/base/config'];
        const alwaysVisible = toolbarConfig?.alwaysVisible;
        const { visible } = state['features/toolbox'];

        if (visible && alwaysVisible) {
            return;
        }

        dispatch({
            type: TOGGLE_TOOLBOX_VISIBLE
        });
    };
}


/**
 * Action to handle toggle video from toolbox's video buttons.
 *
 * @param {boolean} muted - Whether to mute or unmute.
 * @param {boolean} showUI - When set to false will not display any error.
 * @param {boolean} ensureTrack - True if we want to ensure that a new track is
 * created if missing.
 * @returns {Function}
 */
export function handleToggleVideoMuted(muted: boolean, showUI: boolean, ensureTrack: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { enabled: audioOnly } = state['features/base/audio-only'];

        sendAnalytics(createToolbarEvent(VIDEO_MUTE, { enable: muted }));
        if (audioOnly) {
            dispatch(setAudioOnly(false));
        }

        dispatch(
            setVideoMuted(
                muted,
                VIDEO_MUTISM_AUTHORITY.USER,
                ensureTrack));

        // FIXME: The old conference logic still relies on this event being
        // emitted.
        typeof APP === 'undefined'
            || APP.UI.emitEvent(UIEvents.VIDEO_MUTED, muted, showUI);

    };
}

/**
 * Sets whether the toolbox should be shifted up or not.
 *
 * @param {boolean} shiftUp - Whether the toolbox should shift up or not.
 * @returns {Object}
 */
export function setShiftUp(shiftUp: boolean) {
    return {
        type: SET_TOOLBOX_SHIFT_UP,
        shiftUp
    };
}

// @flow

import type { Dispatch } from 'redux';

import UIEvents from '../../../service/UI/UIEvents';
import { createToolbarEvent, sendAnalytics, VIDEO_MUTE } from '../analytics';
import { setAudioOnly } from '../base/audio-only';
import { setVideoMuted, VIDEO_MUTISM_AUTHORITY } from '../base/media';
import { getLocalVideoType } from '../base/tracks';

import {
    SET_TOOLBOX_ENABLED,
    SET_TOOLBOX_VISIBLE,
    TOGGLE_TOOLBOX_VISIBLE
} from './actionTypes';

declare var APP: Object;

/**
 * Enables/disables the toolbox.
 *
 * @param {boolean} enabled - True to enable the toolbox or false to disable it.
 * @returns {{
 *     type: SET_TOOLBOX_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setToolboxEnabled(enabled: boolean): Object {
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
export function setToolboxVisible(visible: boolean): Object {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { toolbarConfig: { alwaysVisible } } = getState()['features/base/config'];

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
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { toolbarConfig: { alwaysVisible } } = state['features/base/config'];
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
export function handleToggleVideoMuted(muted, showUI, ensureTrack) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { enabled: audioOnly } = state['features/base/audio-only'];
        const tracks = state['features/base/tracks'];

        sendAnalytics(createToolbarEvent(VIDEO_MUTE, { enable: muted }));
        if (audioOnly) {
            dispatch(setAudioOnly(false));
        }
        const mediaType = getLocalVideoType(tracks);

        dispatch(
            setVideoMuted(
                muted,
                mediaType,
                VIDEO_MUTISM_AUTHORITY.USER,
                ensureTrack));

        // FIXME: The old conference logic still relies on this event being
        // emitted.
        typeof APP === 'undefined'
            || APP.UI.emitEvent(UIEvents.VIDEO_MUTED, muted, showUI);

    };
}

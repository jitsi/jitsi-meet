// @flow

import type { Dispatch } from 'redux';

import UIEvents from '../../../../service/UI/UIEvents';
import { createAudioOnlyChangedEvent, sendAnalytics } from '../../analytics';

import { SET_AUDIO_ONLY } from './actionTypes';
import logger from './logger';


declare var APP: Object;

/**
 * Sets the audio-only flag for the current JitsiConference.
 *
 * @param {boolean} audioOnly - True if the conference should be audio only;
 * false, otherwise.
 * @param {boolean} ensureVideoTrack - Define if conference should ensure
 * to create a video track.
 * @returns {{
 *     type: SET_AUDIO_ONLY,
 *     audioOnly: boolean,
 *     ensureVideoTrack: boolean
 * }}
 */
export function setAudioOnly(audioOnly: boolean, ensureVideoTrack: boolean = false) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { enabled: oldValue } = getState()['features/base/audio-only'];

        if (oldValue !== audioOnly) {
            sendAnalytics(createAudioOnlyChangedEvent(audioOnly));
            logger.log(`Audio-only ${audioOnly ? 'enabled' : 'disabled'}`);

            dispatch({
                type: SET_AUDIO_ONLY,
                audioOnly,
                ensureVideoTrack
            });

            if (typeof APP !== 'undefined') {
                // TODO This should be a temporary solution that lasts only until video
                // tracks and all ui is moved into react/redux on the web.
                APP.UI.emitEvent(UIEvents.TOGGLE_AUDIO_ONLY, audioOnly);
            }
        }
    };
}

/**
 * Toggles the audio-only flag for the current JitsiConference.
 *
 * @returns {Function}
 */
export function toggleAudioOnly() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { enabled } = getState()['features/base/audio-only'];

        return dispatch(setAudioOnly(!enabled, true));
    };
}

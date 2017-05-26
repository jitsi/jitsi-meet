/* @flow */

import type { Dispatch } from 'redux';

import { appNavigate } from '../app';
import { toggleAudioMuted, toggleVideoMuted } from '../base/media';

/**
 * Maps (redux) actions to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {{
 *     _onHangup: Function,
 *     _onToggleAudio: Function,
 *     _onToggleVideo: Function
 * }}
 * @private
 */
export function abstractMapDispatchToProps(dispatch: Dispatch<*>): Object {
    return {
        /**
         * Dispatches action to leave the current conference.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        _onHangup() {
            // XXX We don't know here which value is effectively/internally
            // used when there's no valid room name to join. It isn't our
            // business to know that anyway. The undefined value is our
            // expression of (1) the lack of knowledge & (2) the desire to no
            // longer have a valid room name to join.
            return dispatch(appNavigate(undefined));
        },

        /**
         * Dispatches an action to toggle the mute state of the
         * audio/microphone.
         *
         * @private
         * @returns {Object} - Dispatched action.
         * @type {Function}
         */
        _onToggleAudio() {
            return dispatch(toggleAudioMuted());
        },

        /**
         * Dispatches an action to toggle the mute state of the video/camera.
         *
         * @private
         * @returns {Object} - Dispatched action.
         * @type {Function}
         */
        _onToggleVideo() {
            return dispatch(toggleVideoMuted());
        }
    };
}

/**
 * Maps parts of media state to component props.
 *
 * @param {Object} state - Redux state.
 * @protected
 * @returns {{
 *     _audioMuted: boolean,
 *     _videoMuted: boolean,
 *     _visible: boolean
 * }}
 */
export function abstractMapStateToProps(state: Object): Object {
    const media = state['features/base/media'];
    const { visible } = state['features/toolbox'];

    return {
        /**
         * Flag showing that audio is muted.
         *
         * @protected
         * @type {boolean}
         */
        _audioMuted: media.audio.muted,

        /**
         * Flag showing whether video is muted.
         *
         * @protected
         * @type {boolean}
         */
        _videoMuted: media.video.muted,

        /**
         * Flag showing whether toolbox is visible.
         *
         * @protected
         * @type {boolean}
         */
        _visible: visible
    };
}

/**
 * Returns the button object corresponding to the given buttonName.
 *
 * @param {string} buttonName - The name of the button.
 * @param {Object} state - The current state.
 * @returns {Object} - The button object.
 */
export function getButton(buttonName: string, state: Object) {
    const { primaryToolbarButtons, secondaryToolbarButtons }
        = state['features/toolbox'];

    return primaryToolbarButtons.get(buttonName)
        || secondaryToolbarButtons.get(buttonName);
}

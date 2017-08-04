/* @flow */

import type { Dispatch } from 'redux';

import { appNavigate } from '../app';
import { getLocalAudioTrack, getLocalVideoTrack } from '../base/tracks';

/**
 * Maps redux actions to {@link Toolbox} (React {@code Component}) props.
 *
 * @param {Function} dispatch - The redux {@code dispatch} function.
 * @returns {{
 *     _onHangup: Function,
 *     _onToggleAudio: Function,
 *     _onToggleVideo: Function
 * }}
 * @private
 */
export function abstractMapDispatchToProps(dispatch: Dispatch<*>): Object {
    return {
        // Inject {@code dispatch} into the React Component's props in case it
        // needs to dispatch an action in the redux store without
        // {@code mapDispatchToProps}.
        dispatch,

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
            dispatch(appNavigate(undefined));
        }
    };
}

/**
 * Maps parts of the redux state to {@link Toolbox} (React {@code Component})
 * props.
 *
 * @param {Object} state - The redux state of which parts are to be mapped to
 * {@code Toolbox} props.
 * @protected
 * @returns {{
 *     _audioMuted: boolean,
 *     _videoMuted: boolean,
 *     _visible: boolean
 * }}
 */
export function abstractMapStateToProps(state: Object): Object {
    const tracks = state['features/base/tracks'];
    const { visible } = state['features/toolbox'];

    const audioTrack = getLocalAudioTrack(tracks);
    const videoTrack = getLocalVideoTrack(tracks);

    return {
        /**
         * Flag showing whether audio is muted.
         *
         * @protected
         * @type {boolean}
         */
        _audioMuted: !audioTrack || audioTrack.muted,

        /**
         * Flag showing whether video is muted.
         *
         * @protected
         * @type {boolean}
         */
        _videoMuted: !videoTrack || videoTrack.muted,

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
 * Returns the button object corresponding to a specific {@code buttonName}.
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

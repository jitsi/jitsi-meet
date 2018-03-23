// @flow

import { MEDIA_TYPE } from '../base/media';
import { isLocalTrackMuted } from '../base/tracks';

import type { Dispatch } from 'redux';

/**
 * Maps redux actions to {@link Toolbox} (React {@code Component}) props.
 *
 * @param {Function} dispatch - The redux {@code dispatch} function.
 * @private
 * @returns {{
 *     _onHangup: Function,
 *     _onToggleAudio: Function,
 *     _onToggleVideo: Function
 * }}
 */
export function abstractMapDispatchToProps(dispatch: Dispatch<*>): Object {
    return {
        // Inject {@code dispatch} into the React Component's props in case it
        // needs to dispatch an action in the redux store without
        // {@code mapDispatchToProps}.
        dispatch
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

    return {
        /**
         * Flag showing whether audio is muted.
         *
         * @protected
         * @type {boolean}
         */
        _audioMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO),

        /**
         * Flag showing whether video is muted.
         *
         * @protected
         * @type {boolean}
         */
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO),

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

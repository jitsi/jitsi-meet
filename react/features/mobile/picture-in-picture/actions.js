// @flow

import { NativeModules } from 'react-native';

import {
    ENTER_PICTURE_IN_PICTURE,
    _SET_EMITTER_SUBSCRIPTIONS
} from './actionTypes';

/**
 * Enters (or rather initiates entering) picture-in-picture.
 * Helper function to enter PiP mode. This is triggered by user request
 * (either pressing the button in the toolbox or the home button on Android)
 * ans this triggers the PiP mode, iff it's available and we are in a
 * conference.
 *
 * @public
 * @returns {Function}
 */
export function enterPictureInPicture() {
    return (dispatch: Dispatch, getState: Function) => {
        const state = getState();
        const { app } = state['features/app'];
        const { conference, joining } = state['features/base/conference'];

        if (app
                && app.props.pictureInPictureEnabled
                && (conference || joining)) {
            const { PictureInPicture } = NativeModules;
            const p
                = PictureInPicture
                    ? PictureInPicture.enterPictureInPicture()
                    : Promise.reject(
                        new Error('Picture-in-Picture not supported'));

            p.then(
                () => dispatch({ type: ENTER_PICTURE_IN_PICTURE }),
                e => console.warn(`Error entering PiP mode: ${e}`));
        }
    };
}

/**
 * Sets the {@code EventEmitter} subscriptions utilized by the feature
 * picture-in-picture.
 *
 * @param {Array<Object>} emitterSubscriptions - The {@code EventEmitter}
 * subscriptions to be set.
 * @protected
 * @returns {{
 *     type: _SET_EMITTER_SUBSCRIPTIONS,
 *     emitterSubscriptions: Array<Object>
 * }}
 */
export function _setEmitterSubscriptions(emitterSubscriptions: ?Array<Object>) {
    return {
        type: _SET_EMITTER_SUBSCRIPTIONS,
        emitterSubscriptions
    };
}

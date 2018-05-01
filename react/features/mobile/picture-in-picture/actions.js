// @flow

import { NativeModules } from 'react-native';

import { Platform } from '../../base/react';

import { ENTER_PICTURE_IN_PICTURE } from './actionTypes';

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

        // FIXME We want to be able to enter Picture-in-Picture as soon as we
        // are on the Conference page i.e. even before `joining` was set in the
        // reducer.
        const { conference, joining } = state['features/base/conference'];

        if (app
                && app.props.pictureInPictureEnabled
                && (conference || joining)) {
            const { PictureInPicture } = NativeModules;
            const p
                = Platform.OS === 'android'
                    ? PictureInPicture
                        ? PictureInPicture.enterPictureInPicture()
                        : Promise.reject(
                            new Error('Picture-in-Picture not supported'))
                    : Promise.resolve();

            p.then(
                () => dispatch({ type: ENTER_PICTURE_IN_PICTURE }),
                e => console.warn(`Error entering PiP mode: ${e}`));
        }
    };
}

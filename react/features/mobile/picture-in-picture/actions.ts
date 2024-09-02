import { NativeModules } from 'react-native';

import { IStore } from '../../app/types';
import Platform from '../../base/react/Platform.native';

import { ENTER_PICTURE_IN_PICTURE } from './actionTypes';
import { isPipEnabled } from './functions';
import logger from './logger';

/**
 * Enters (or rather initiates entering) picture-in-picture.
 * Helper function to enter PiP mode. This is triggered by user request
 * (either pressing the button in the toolbox or the home button on Android)
 * and this triggers the PiP mode, iff it's available and we are in a
 * conference.
 *
 * @public
 * @returns {Function}
 */
export function enterPictureInPicture() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        // XXX At the time of this writing this action can only be dispatched by
        // the button which is on the conference view, which means that it's
        // fine to enter PiP mode.
        if (isPipEnabled(getState())) {
            const { PictureInPicture } = NativeModules;
            const p
                = Platform.OS === 'android'
                    ? PictureInPicture
                        ? PictureInPicture.enterPictureInPicture()
                        : Promise.reject(
                            new Error('Picture-in-Picture not supported'))
                    : Promise.resolve();

            p.catch((e: string) => logger.warn(`Error entering PiP mode: ${e}`));

            // We should still dispatch ENTER_PICTURE_IN_PICTURE for cases where
            // the external app needs to handle the event (ie. react-native-sdk)
            p.finally(() => dispatch({ type: ENTER_PICTURE_IN_PICTURE }));
        }
    };
}

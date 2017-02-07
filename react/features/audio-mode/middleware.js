/* @flow */

import { NativeModules } from 'react-native';

import { APP_WILL_MOUNT } from '../app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN
} from '../base/conference';
import { MiddlewareRegistry } from '../base/redux';

/**
 * Middleware that captures conference actions and sets the correct audio mode
 * based on the type of conference. Audio-only conferences don't use the speaker
 * by default, and video conferences do.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const AudioMode = NativeModules.AudioMode;

    // The react-native module AudioMode is implemented on iOS at the time of
    // this writing.
    if (AudioMode) {
        let mode;

        switch (action.type) {
        case APP_WILL_MOUNT:
        case CONFERENCE_FAILED:
        case CONFERENCE_LEFT:
            mode = AudioMode.DEFAULT;
            break;

        case CONFERENCE_WILL_JOIN: {
            const conference = store.getState()['features/base/conference'];

            mode
                = conference.audioOnly
                    ? AudioMode.AUDIO_CALL
                    : AudioMode.VIDEO_CALL;
            break;
        }

        default:
            mode = null;
            break;
        }

        if (mode !== null) {
            AudioMode.setMode(mode)
                .catch(err =>
                    console.error(
                            `Failed to set audio mode ${String(mode)}: `
                                + `${err}`));
        }
    }

    return next(action);
});

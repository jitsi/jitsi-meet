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
        let audioMode;

        switch (action.type) {
        case APP_WILL_MOUNT:
        case CONFERENCE_FAILED:
        case CONFERENCE_LEFT:
            audioMode = AudioMode.DEFAULT;
            break;

        case CONFERENCE_WILL_JOIN: {
            const conference = store.getState()['features/base/conference'];

            audioMode
                = conference.audioOnly
                    ? AudioMode.AUDIO_CALL
                    : AudioMode.VIDEO_CALL;
            break;
        }

        default:
            audioMode = null;
            break;
        }

        if (audioMode !== null) {
            AudioMode.setMode(audioMode).catch(err => {
                console.error(`Failed to set audio mode ${audioMode}: ${err}`);
            });
        }
    }

    return next(action);
});

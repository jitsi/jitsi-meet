import { AudioMode } from '../base/react-native';

import { APP_WILL_MOUNT } from '../app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN
} from '../base/conference';

import { MiddlewareRegistry } from '../base/redux';

/**
 * Middleware that captures conference actions and sets the correct audio
 * mode based on the type of conference.  Audio-only conferences don't
 * use the speaker by default, and video conferences do.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT: {
        AudioMode.setMode(AudioMode.DEFAULT)
            .catch(err => {
                console.warn(`Error setting audio mode: ${err}`);
            });
        break;
    }
    case CONFERENCE_WILL_JOIN: {
        let mode;
        const state = store.getState()['features/base/conference'];

        if (state.audioOnly) {
            // TODO(saghul): Implement audio-only mode
            mode = AudioMode.AUDIO_CALL;
        } else {
            mode = AudioMode.VIDEO_CALL;
        }

        AudioMode.setMode(mode)
            .catch(err => {
                console.warn(`Error setting audio mode: ${err}`);
            });
        break;
    }
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        AudioMode.setMode(AudioMode.DEFAULT)
            .catch(err => {
                console.warn(`Error setting audio mode: ${err}`);
            });
        break;
    }

    return next(action);
});

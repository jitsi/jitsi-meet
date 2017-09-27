/* @flow */

import { Platform } from 'react-native';
import * as watch from 'react-native-watch-connectivity';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT, appNavigate } from '../../app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN
} from '../../base/conference';
import {
    toggleAudioMuted
} from '../../base/media';
import { MiddlewareRegistry } from '../../base/redux';


/**
 * Middleware that captures conference actions and sets the correct audio mode
 * based on the type of conference. Audio-only conferences don't use the speaker
 * by default, and video conferences do.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    if (Platform.OS !== 'ios') {
        return result;
    }

    switch (action.type) {
    case APP_WILL_MOUNT: {
        watch.subscribeToWatchState((err, watchState) => {
            if (!err) {
                console.log('watchState', watchState);
            } else {
                console.log('ERROR getting watchState');
            }
        });

        watch.subscribeToMessages((err, message) => {
            if (err) {
                console.log('ERROR getting watch message');
            } else {
                switch (message.command) {
                case 'joinConference':
                    dispatch(appNavigate(message.data));
                    break;
                case 'toggleMute':
                    dispatch(toggleAudioMuted());
                    break;
                case 'hangup':
                    dispatch(appNavigate(undefined));
                    break;
                }
            }
        });

        break;
    }
    case APP_WILL_UNMOUNT:
        break;
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        break;
    case CONFERENCE_WILL_JOIN:
        break;
    }

    return result;
});

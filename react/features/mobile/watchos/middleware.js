/* @flow */

import { Platform } from 'react-native';
import * as watch from 'react-native-watch-connectivity';

import {
    SET_CONFERENCE_URL,
    SET_MIC_MUTED,
    SET_RECENT_URLS
} from './actionTypes';
import { ADD_RECENT_URL, LOADED_RECENT_URLS } from '../../recent';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT, appNavigate } from '../../app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT
} from '../../base/conference';
import {
    MEDIA_TYPE as MediaType,
    toggleAudioMuted
} from '../../base/media';
import { MiddlewareRegistry } from '../../base/redux';
import { getInviteURL } from '../../base/connection/functions';
import {
    isLocalTrackMuted,
    TRACK_ADDED,
    TRACK_REMOVED,
    TRACK_UPDATED
} from '../../base/tracks';


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

                // FIXME that does not seem to help with the initial sync up
                // if (watchState === 'Activated') {
                //    _updateApplicationContext(getState);
                // }
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
    case ADD_RECENT_URL:
    case LOADED_RECENT_URLS: {
        dispatch({
            type: SET_RECENT_URLS,
            recentURLs: getState()['features/recent'].entries
        });
        break;
    }
    case TRACK_ADDED:
    case TRACK_REMOVED:
    case TRACK_UPDATED: {
        // FIXME Note sure how this will be accurate before the tracks are
        // created. If no tracks I guess we should use /base/media state.
        const tracks = getState()['features/base/tracks'];
        const micMuted = isLocalTrackMuted(tracks, MediaType.AUDIO);

        dispatch({
            type: SET_MIC_MUTED,
            micMuted
        });
        break;
    }
    case CONFERENCE_JOINED:
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT: {
        const { conference } = getState()['features/base/conference'];

        // NOTE for some reason 'null' does not update context - must be string
        const conferenceURL = conference ? getInviteURL(getState) : 'NULL';

        dispatch({
            type: SET_CONFERENCE_URL,
            conferenceURL
        });
        break;
    }

    // Here list all actions that affect the watch OS application context.
    // The reducer should form all those actions into our context structure.
    case SET_CONFERENCE_URL:
    case SET_MIC_MUTED:
    case SET_RECENT_URLS: {
        _updateApplicationContext(getState);
        break;
    }
    case APP_WILL_UNMOUNT:
        break;
    }

    return result;
});

function _updateApplicationContext(getState) {
    const context = getState()['features/mobile/watchos'];

    console.info('UPDATING WATCH CONTEXT', context);
    watch.updateApplicationContext(context);
}

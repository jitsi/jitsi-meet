import { IReduxState } from '../app/types';
import {
    CONFERENCE_JOINED,
    CONFERENCE_WILL_LEAVE,
    SET_ROOM
} from '../base/conference/actionTypes';
import { SET_CONFIG } from '../base/config/actionTypes';
import { analytics } from '../base/lib-jitsi-meet';
import { SET_NETWORK_INFO } from '../base/net-info/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import {
    TRACK_ADDED,
    TRACK_REMOVED,
    TRACK_UPDATED
} from '../base/tracks/actionTypes';
import {
    getLocalAudioTrack,
    getLocalVideoTrack
} from '../base/tracks/functions';
import { SET_LOBBY_VISIBILITY } from '../lobby/actionTypes';
import { getIsLobbyVisible } from '../lobby/functions';
import { I_AM_VISITOR_MODE } from '../visitors/actionTypes';
import { iAmVisitor } from '../visitors/functions';

import { createLocalTracksDurationEvent, createNetworkInfoEvent } from './AnalyticsEvents';
import { UPDATE_LOCAL_TRACKS_DURATION } from './actionTypes';
import { createHandlers, initAnalytics, resetAnalytics, sendAnalytics } from './functions';

/**
 * Calculates the duration of the local tracks.
 *
 * @param {Object} state - The redux state.
 * @returns {Object} - The local tracks duration.
 */
function calculateLocalTrackDuration(state: IReduxState) {
    const now = Date.now();
    const { localTracksDuration } = state['features/analytics'];
    const { conference } = state['features/base/conference'];
    const { audio, video } = localTracksDuration;
    const { camera, desktop } = video;
    const tracks = state['features/base/tracks'];
    const audioTrack = getLocalAudioTrack(tracks);
    const videoTrack = getLocalVideoTrack(tracks);
    const newDuration = { ...localTracksDuration };

    if (!audioTrack || audioTrack.muted || !conference) {
        newDuration.audio = {
            startedTime: -1,
            value: audio.value + (audio.startedTime === -1 ? 0 : now - audio.startedTime)
        };
    } else if (audio.startedTime === -1) {
        newDuration.audio.startedTime = now;
    }

    if (!videoTrack || videoTrack.muted || !conference) {
        newDuration.video = {
            camera: {
                startedTime: -1,
                value: camera.value + (camera.startedTime === -1 ? 0 : now - camera.startedTime)
            },
            desktop: {
                startedTime: -1,
                value: desktop.value + (desktop.startedTime === -1 ? 0 : now - desktop.startedTime)
            }
        };
    } else {
        const { videoType } = videoTrack;

        if (video[videoType as keyof typeof video].startedTime === -1) {
            newDuration.video[videoType as keyof typeof video].startedTime = now;
        }
    }

    return {
        ...localTracksDuration,
        ...newDuration
    };
}

/**
 * Middleware which intercepts config actions to handle evaluating analytics
 * config based on the config stored in the store.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case I_AM_VISITOR_MODE: {
        const oldIAmVisitor = iAmVisitor(store.getState());
        const result = next(action);
        const newIAmVisitor = iAmVisitor(store.getState());

        analytics.addPermanentProperties({
            isVisitor: newIAmVisitor,
            isPromotedFromVisitor: oldIAmVisitor && !newIAmVisitor
        });

        return result;
    }
    case SET_CONFIG:
        if (navigator.product === 'ReactNative') {
            // Resetting the analytics is currently not needed for web because
            // the user will be redirected to another page and new instance of
            // Analytics will be created and initialized.
            resetAnalytics();
        }
        break;
    case SET_ROOM: {
        // createHandlers is called before the SET_ROOM action is executed in order for Amplitude to initialize before
        // the deeplinking logic is executed (after the SET_ROOM action) so that the Amplitude device id is available
        // if needed.
        const createHandlersPromise = createHandlers(store);
        const result = next(action);

        createHandlersPromise.then(handlers => {
            initAnalytics(store, handlers);
        });

        return result;
    }
    }

    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { dispatch, getState } = store;
        const state = getState();

        dispatch({
            type: UPDATE_LOCAL_TRACKS_DURATION,
            localTracksDuration: {
                ...calculateLocalTrackDuration(state),
                conference: {
                    startedTime: Date.now(),
                    value: 0
                }
            }
        });
        break;
    }

    case CONFERENCE_WILL_LEAVE: {
        const { dispatch, getState } = store;
        const state = getState();
        const { localTracksDuration } = state['features/analytics'];
        const newLocalTracksDuration = {
            ...calculateLocalTrackDuration(state),
            conference: {
                startedTime: -1,
                value: Date.now() - localTracksDuration.conference.startedTime
            }
        };

        sendAnalytics(createLocalTracksDurationEvent(newLocalTracksDuration));

        dispatch({
            type: UPDATE_LOCAL_TRACKS_DURATION,
            localTracksDuration: newLocalTracksDuration
        });
        break;
    }
    case SET_LOBBY_VISIBILITY:
        if (getIsLobbyVisible(store.getState())) {
            analytics.addPermanentProperties({
                wasLobbyVisible: true
            });
        }

        break;
    case SET_NETWORK_INFO:
        sendAnalytics(
            createNetworkInfoEvent({
                isOnline: action.isOnline,
                details: action.details,
                networkType: action.networkType
            }));
        break;
    case TRACK_ADDED:
    case TRACK_REMOVED:
    case TRACK_UPDATED: {
        const { dispatch, getState } = store;
        const state = getState();
        const { localTracksDuration } = state['features/analytics'];

        if (localTracksDuration.conference.startedTime === -1) {
            // We don't want to track the media duration if the conference is not joined yet because otherwise we won't
            // be able to compare them with the conference duration (from conference join to conference will leave).
            break;
        }
        dispatch({
            type: UPDATE_LOCAL_TRACKS_DURATION,
            localTracksDuration: {
                ...localTracksDuration,
                ...calculateLocalTrackDuration(state)
            }
        });
        break;
    }
    }

    return result;
});

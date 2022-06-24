// @flow

import {
    createStartAudioOnlyEvent,
    createStartMutedConfigurationEvent,
    createSyncTrackStateEvent,
    createTrackMutedEvent,
    sendAnalytics
} from '../../analytics';
import { APP_STATE_CHANGED } from '../../mobile/background';
import {
    NOTIFICATION_TIMEOUT_TYPE,
    showWarningNotification
} from '../../notifications';
import { isForceMuted } from '../../participants-pane/functions';
import { isScreenMediaShared } from '../../screen-share/functions';
import { SET_AUDIO_ONLY, setAudioOnly } from '../audio-only';
import { isRoomValid, SET_ROOM } from '../conference';
import { getMultipleVideoSendingSupportFeatureFlag } from '../config';
import { getLocalParticipant } from '../participants';
import { MiddlewareRegistry } from '../redux';
import { getPropertyValue } from '../settings';
import {
    destroyLocalTracks,
    isLocalTrackMuted,
    isLocalVideoTrackDesktop,
    setTrackMuted,
    TRACK_ADDED
} from '../tracks';

import {
    SET_AUDIO_MUTED,
    SET_AUDIO_UNMUTE_PERMISSIONS,
    SET_SCREENSHARE_MUTED,
    SET_VIDEO_MUTED,
    SET_VIDEO_UNMUTE_PERMISSIONS
} from './actionTypes';
import {
    setAudioMuted,
    setCameraFacingMode,
    setScreenshareMuted,
    setVideoMuted
} from './actions';
import {
    CAMERA_FACING_MODE,
    MEDIA_TYPE,
    SCREENSHARE_MUTISM_AUTHORITY,
    VIDEO_MUTISM_AUTHORITY
} from './constants';
import { getStartWithAudioMuted, getStartWithVideoMuted } from './functions';
import logger from './logger';
import {
    _AUDIO_INITIAL_MEDIA_STATE,
    _VIDEO_INITIAL_MEDIA_STATE
} from './reducer';

/**
 * Implements the entry point of the middleware of the feature base/media.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_STATE_CHANGED:
        return _appStateChanged(store, next, action);

    case SET_AUDIO_ONLY:
        return _setAudioOnly(store, next, action);

    case SET_ROOM:
        return _setRoom(store, next, action);

    case TRACK_ADDED: {
        const result = next(action);
        const { track } = action;

        // Don't sync track mute state with the redux store for screenshare
        // since video mute state represents local camera mute state only.
        track.local && track.videoType !== 'desktop'
            && _syncTrackMutedState(store, track);

        return result;
    }

    case SET_AUDIO_MUTED: {
        const state = store.getState();
        const participant = getLocalParticipant(state);

        if (!action.muted && isForceMuted(participant, MEDIA_TYPE.AUDIO, state)) {
            return;
        }
        break;
    }

    case SET_AUDIO_UNMUTE_PERMISSIONS: {
        const { blocked, skipNotification } = action;
        const state = store.getState();
        const tracks = state['features/base/tracks'];
        const isAudioMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO);

        if (blocked && isAudioMuted && !skipNotification) {
            store.dispatch(showWarningNotification({
                descriptionKey: 'notify.audioUnmuteBlockedDescription',
                titleKey: 'notify.audioUnmuteBlockedTitle'
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        }
        break;
    }

    case SET_SCREENSHARE_MUTED: {
        const state = store.getState();
        const participant = getLocalParticipant(state);

        if (!action.muted && isForceMuted(participant, MEDIA_TYPE.SCREENSHARE, state)) {
            return;
        }
        break;
    }
    case SET_VIDEO_MUTED: {
        const state = store.getState();
        const participant = getLocalParticipant(state);

        if (!action.muted && isForceMuted(participant, MEDIA_TYPE.VIDEO, state)) {
            return;
        }
        break;
    }

    case SET_VIDEO_UNMUTE_PERMISSIONS: {
        const { blocked, skipNotification } = action;
        const state = store.getState();
        const tracks = state['features/base/tracks'];
        const isVideoMuted = isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO);
        const isMediaShared = isScreenMediaShared(state);

        if (blocked && isVideoMuted && !isMediaShared && !skipNotification) {
            store.dispatch(showWarningNotification({
                descriptionKey: 'notify.videoUnmuteBlockedDescription',
                titleKey: 'notify.videoUnmuteBlockedTitle'
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        }
        break;
    }
    }

    return next(action);
});

/**
 * Adjusts the video muted state based on the app state.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code APP_STATE_CHANGED} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _appStateChanged({ dispatch, getState }, next, action) {
    if (navigator.product === 'ReactNative') {
        const { appState } = action;
        const mute = appState !== 'active' && !isLocalVideoTrackDesktop(getState());

        sendAnalytics(createTrackMutedEvent('video', 'background mode', mute));

        dispatch(setVideoMuted(mute, MEDIA_TYPE.VIDEO, VIDEO_MUTISM_AUTHORITY.BACKGROUND));
    }

    return next(action);
}

/**
 * Adjusts the video muted state based on the audio-only state.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_AUDIO_ONLY} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setAudioOnly({ dispatch, getState }, next, action) {
    const { audioOnly, ensureVideoTrack } = action;
    const state = getState();

    sendAnalytics(createTrackMutedEvent('video', 'audio-only mode', audioOnly));

    // Make sure we mute both the desktop and video tracks.
    dispatch(setVideoMuted(audioOnly, MEDIA_TYPE.VIDEO, VIDEO_MUTISM_AUTHORITY.AUDIO_ONLY, ensureVideoTrack));
    if (getMultipleVideoSendingSupportFeatureFlag(state)) {
        dispatch(setScreenshareMuted(audioOnly, MEDIA_TYPE.SCREENSHARE, SCREENSHARE_MUTISM_AUTHORITY.AUDIO_ONLY));
    } else if (navigator.product !== 'ReactNative') {
        dispatch(setVideoMuted(audioOnly, MEDIA_TYPE.PRESENTER, VIDEO_MUTISM_AUTHORITY.AUDIO_ONLY, ensureVideoTrack));
    }

    return next(action);
}

/**
 * Notifies the feature base/media that the action {@link SET_ROOM} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action, {@code SET_ROOM}, which is being
 * dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _setRoom({ dispatch, getState }, next, action) {
    // Figure out the desires/intents i.e. the state of base/media. There are
    // multiple desires/intents ordered by precedence such as server-side
    // config, config overrides in the user-supplied URL, user's own app
    // settings, etc.

    const state = getState();
    const { room } = action;
    const roomIsValid = isRoomValid(room);
    const audioMuted = roomIsValid ? getStartWithAudioMuted(state) : _AUDIO_INITIAL_MEDIA_STATE.muted;
    const videoMuted = roomIsValid ? getStartWithVideoMuted(state) : _VIDEO_INITIAL_MEDIA_STATE.muted;

    sendAnalytics(
        createStartMutedConfigurationEvent('local', audioMuted, videoMuted));
    logger.log(
        `Start muted: ${audioMuted ? 'audio, ' : ''}${
            videoMuted ? 'video' : ''}`);

    // Unconditionally express the desires/expectations/intents of the app and
    // the user i.e. the state of base/media. Eventually, practice/reality i.e.
    // the state of base/tracks will or will not agree with the desires.
    dispatch(setAudioMuted(audioMuted));
    dispatch(setCameraFacingMode(CAMERA_FACING_MODE.USER));
    dispatch(setVideoMuted(videoMuted));

    // startAudioOnly
    //
    // FIXME Technically, the audio-only feature is owned by base/conference,
    // not base/media so the following should be in base/conference.
    // Practically, I presume it was easier to write the source code here
    // because it looks like startWithAudioMuted and startWithVideoMuted.
    //
    // XXX After the introduction of the "Video <-> Voice" toggle on the
    // WelcomePage, startAudioOnly is utilized even outside of
    // conferences/meetings.
    const audioOnly
        = Boolean(
            getPropertyValue(
                state,
                'startAudioOnly',
                /* sources */ {
                    // FIXME Practically, base/config is (really) correct
                    // only if roomIsValid. At the time of this writing,
                    // base/config is overwritten by URL params which leaves
                    // base/config incorrect on the WelcomePage after
                    // leaving a conference which explicitly overwrites
                    // base/config with URL params.
                    config: roomIsValid,

                    // XXX We've already overwritten base/config with
                    // urlParams if roomIsValid. However, settings are more
                    // important than the server-side config. Consequently,
                    // we need to read from urlParams anyway. We also
                    // probably want to read from urlParams when
                    // !roomIsValid.
                    urlParams: true,

                    // The following don't have complications around whether
                    // they are defined or not:
                    jwt: false,
                    settings: true
                }));

    sendAnalytics(createStartAudioOnlyEvent(audioOnly));
    logger.log(`Start audio only set to ${audioOnly.toString()}`);

    dispatch(setAudioOnly(audioOnly, false));

    if (!roomIsValid) {
        dispatch(destroyLocalTracks());
    }

    return next(action);
}

/**
 * Syncs muted state of local media track with muted state from media state.
 *
 * @param {Store} store - The redux store.
 * @param {Track} track - The local media track.
 * @private
 * @returns {void}
 */
function _syncTrackMutedState({ getState }, track) {
    const state = getState()['features/base/media'];
    const mediaType = track.mediaType === MEDIA_TYPE.PRESENTER
        ? MEDIA_TYPE.VIDEO : track.mediaType;
    const muted = Boolean(state[mediaType].muted);

    // XXX If muted state of track when it was added is different from our media
    // muted state, we need to mute track and explicitly modify 'muted' property
    // on track. This is because though TRACK_ADDED action was dispatched it's
    // not yet in redux state and JitsiTrackEvents.TRACK_MUTE_CHANGED may be
    // fired before track gets to state.
    if (track.muted !== muted) {
        sendAnalytics(createSyncTrackStateEvent(track.mediaType, muted));
        logger.log(`Sync ${track.mediaType} track muted state to ${muted ? 'muted' : 'unmuted'}`);

        track.muted = muted;
        setTrackMuted(track.jitsiTrack, muted, state);
    }
}

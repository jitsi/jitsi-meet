import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import { hideNotification } from '../../notifications/actions';
import { isPrejoinPageVisible } from '../../prejoin/functions';
import { getAvailableDevices } from '../devices/actions.web';
import { setScreenshareMuted } from '../media/actions';
import {
    MEDIA_TYPE,
    VIDEO_TYPE
} from '../media/constants';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import {
    TRACK_ADDED,
    TRACK_MUTE_UNMUTE_FAILED,
    TRACK_NO_DATA_FROM_SOURCE,
    TRACK_OWNER_CHANGED,
    TRACK_REMOVED,
    TRACK_STOPPED,
    TRACK_UPDATED
} from './actionTypes';
import {
    showNoDataFromSourceVideoError,
    toggleScreensharing,
    trackNoDataFromSourceNotificationInfoChanged
} from './actions.web';
import {
    getTrackByJitsiTrack, logTracksForParticipant
} from './functions.web';
import { ITrack } from './types';

import './middleware.any';

/**
 * Middleware that captures LIB_DID_DISPOSE and LIB_DID_INIT actions and,
 * respectively, creates/destroys local media tracks. Also listens to
 * media-related actions and performs corresponding operations with tracks.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case TRACK_ADDED: {
        const { local } = action.track;

        // The devices list needs to be refreshed when no initial video permissions
        // were granted and a local video track is added by umuting the video.
        if (local) {
            store.dispatch(getAvailableDevices());
            break;
        }

        const result = next(action);
        const participantId = action.track?.participantId;

        if (participantId) {
            logTracksForParticipant(store.getState()['features/base/tracks'], participantId, 'Track added');
        }

        return result;
    }
    case TRACK_NO_DATA_FROM_SOURCE: {
        const result = next(action);

        _handleNoDataFromSourceErrors(store, action);

        return result;
    }

    case TRACK_REMOVED: {
        _removeNoDataFromSourceNotification(store, action.track);

        const result = next(action);
        const participantId = action.track?.jitsiTrack?.getParticipantId();

        if (participantId && !action.track?.jitsiTrack?.isLocal()) {
            logTracksForParticipant(store.getState()['features/base/tracks'], participantId, 'Track removed');
        }

        return result;
    }

    case TRACK_OWNER_CHANGED: {
        const oldTrack = getTrackByJitsiTrack(store.getState()['features/base/tracks'], action.track?.jitsiTrack);
        const oldOwner = oldTrack?.participantId;
        const result = next(action);
        const newOwner = action.track?.participantId;

        if (oldOwner) {
            logTracksForParticipant(store.getState()['features/base/tracks'], oldOwner, 'Owner changed');
        }

        if (newOwner) {
            logTracksForParticipant(store.getState()['features/base/tracks'], newOwner, 'Owner changed');
        }

        return result;
    }

    case TRACK_MUTE_UNMUTE_FAILED: {
        const { jitsiTrack } = action.track;
        const muted = action.wasMuted;
        const isVideoTrack = jitsiTrack.getType() !== MEDIA_TYPE.AUDIO;

        if (isVideoTrack && jitsiTrack.getVideoType() === VIDEO_TYPE.DESKTOP) {
            store.dispatch(setScreenshareMuted(!muted));
        } else if (isVideoTrack) {
            APP.conference.setVideoMuteStatus();
        } else {
            APP.conference.updateAudioIconEnabled();
        }

        break;
    }

    case TRACK_STOPPED: {
        const { jitsiTrack } = action.track;

        if (jitsiTrack.getVideoType() === VIDEO_TYPE.DESKTOP) {
            store.dispatch(toggleScreensharing(false));
        }
        break;
    }

    case TRACK_UPDATED: {
        // TODO Remove the following calls to APP.UI once components interested
        // in track mute changes are moved into React and/or redux.

        const result = next(action);
        const state = store.getState();

        if (isPrejoinPageVisible(state)) {
            return result;
        }

        const { jitsiTrack } = action.track;
        const participantID = jitsiTrack.getParticipantId();
        const isVideoTrack = jitsiTrack.type !== MEDIA_TYPE.AUDIO;
        const local = jitsiTrack.isLocal();

        if (isVideoTrack) {
            if (local && !(jitsiTrack.getVideoType() === VIDEO_TYPE.DESKTOP)) {
                APP.conference.setVideoMuteStatus();
            } else if (!local) {
                APP.UI.setVideoMuted(participantID);
            }
        } else if (local) {
            APP.conference.updateAudioIconEnabled();
        }

        if (typeof action.track?.muted !== 'undefined' && participantID && !local) {
            logTracksForParticipant(store.getState()['features/base/tracks'], participantID, 'Track updated');
        }

        return result;
    }

    }

    return next(action);
});

/**
 * Handles no data from source errors.
 *
 * @param {Store} store - The redux store in which the specified action is
 * dispatched.
 * @param {Action} action - The redux action dispatched in the specified store.
 * @private
 * @returns {void}
 */
function _handleNoDataFromSourceErrors(store: IStore, action: AnyAction) {
    const { getState, dispatch } = store;

    const track = getTrackByJitsiTrack(getState()['features/base/tracks'], action.track.jitsiTrack);

    if (!track?.local) {
        return;
    }

    const { jitsiTrack } = track;

    if (track.mediaType === MEDIA_TYPE.AUDIO && track.isReceivingData) {
        _removeNoDataFromSourceNotification(store, action.track);
    }

    if (track.mediaType === MEDIA_TYPE.VIDEO) {
        const { noDataFromSourceNotificationInfo = {} } = track;

        if (track.isReceivingData) {
            if (noDataFromSourceNotificationInfo.timeout) {
                clearTimeout(noDataFromSourceNotificationInfo.timeout);
                dispatch(trackNoDataFromSourceNotificationInfoChanged(jitsiTrack, undefined));
            }

            // try to remove the notification if there is one.
            _removeNoDataFromSourceNotification(store, action.track);
        } else {
            if (noDataFromSourceNotificationInfo.timeout) {
                return;
            }

            const timeout = setTimeout(() => dispatch(showNoDataFromSourceVideoError(jitsiTrack)), 5000);

            dispatch(trackNoDataFromSourceNotificationInfoChanged(jitsiTrack, { timeout }));
        }
    }
}

/**
 * Removes the no data from source notification associated with the JitsiTrack if displayed.
 *
 * @param {Store} store - The redux store.
 * @param {Track} track - The redux action dispatched in the specified store.
 * @returns {void}
 */
function _removeNoDataFromSourceNotification({ getState, dispatch }: IStore, track: ITrack) {
    const t = getTrackByJitsiTrack(getState()['features/base/tracks'], track.jitsiTrack);
    const { jitsiTrack, noDataFromSourceNotificationInfo = {} } = t || {};

    if (noDataFromSourceNotificationInfo?.uid) {
        dispatch(hideNotification(noDataFromSourceNotificationInfo.uid));
        dispatch(trackNoDataFromSourceNotificationInfoChanged(jitsiTrack, undefined));
    }
}

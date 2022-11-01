import { IStore } from '../../app/types';
import { hideNotification } from '../../notifications/actions';
import { isPrejoinPageVisible } from '../../prejoin/functions';
import { getMultipleVideoSendingSupportFeatureFlag } from '../config/functions.any';
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
    getTrackByJitsiTrack
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
        }

        break;
    }
    case TRACK_NO_DATA_FROM_SOURCE: {
        const result = next(action);

        _handleNoDataFromSourceErrors(store, action);

        return result;
    }

    case TRACK_REMOVED: {
        _removeNoDataFromSourceNotification(store, action.track);
        break;
    }

    case TRACK_MUTE_UNMUTE_FAILED: {
        const { jitsiTrack } = action.track;
        const muted = action.wasMuted;
        const isVideoTrack = jitsiTrack.getType() !== MEDIA_TYPE.AUDIO;

        if (isVideoTrack && jitsiTrack.getVideoType() === VIDEO_TYPE.DESKTOP
                && getMultipleVideoSendingSupportFeatureFlag(store.getState())) {
            store.dispatch(setScreenshareMuted(!muted));
        } else if (isVideoTrack) {
            APP.conference.setVideoMuteStatus();
        } else {
            APP.conference.setAudioMuteStatus(!muted);
        }

        break;
    }

    case TRACK_STOPPED: {
        const { jitsiTrack } = action.track;

        if (getMultipleVideoSendingSupportFeatureFlag(store.getState())
                && jitsiTrack.getVideoType() === VIDEO_TYPE.DESKTOP) {
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
        const muted = jitsiTrack.isMuted();
        const participantID = jitsiTrack.getParticipantId();
        const isVideoTrack = jitsiTrack.type !== MEDIA_TYPE.AUDIO;

        if (isVideoTrack) {
            // Do not change the video mute state for local presenter tracks.
            if (jitsiTrack.type === MEDIA_TYPE.PRESENTER) {
                APP.conference.mutePresenter(muted);
            } else if (jitsiTrack.isLocal() && !(jitsiTrack.getVideoType() === VIDEO_TYPE.DESKTOP)) {
                APP.conference.setVideoMuteStatus();
            } else if (jitsiTrack.isLocal() && muted && jitsiTrack.getVideoType() === VIDEO_TYPE.DESKTOP) {
                !getMultipleVideoSendingSupportFeatureFlag(state)
                    && store.dispatch(toggleScreensharing(false, false, true));
            } else {
                APP.UI.setVideoMuted(participantID);
            }
        } else if (jitsiTrack.isLocal()) {
            APP.conference.setAudioMuteStatus(muted);
        } else {
            APP.UI.setAudioMuted(participantID, muted);
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
function _handleNoDataFromSourceErrors(store: IStore, action: any) {
    const { getState, dispatch } = store;

    const track = getTrackByJitsiTrack(getState()['features/base/tracks'], action.track.jitsiTrack);

    if (!track || !track.local) {
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

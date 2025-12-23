import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import { hideNotification } from '../../notifications/actions';
import { isPrejoinPageVisible } from '../../prejoin/functions';
import { setAudioSettings } from '../../settings/actions.web';
import { getAvailableDevices } from '../devices/actions.web';
import { SET_AUDIO_MUTED } from '../media/actionTypes';
import { gumPending, setScreenshareMuted } from '../media/actions';
import {
    MEDIA_TYPE,
    VIDEO_TYPE
} from '../media/constants';
import { IGUMPendingState } from '../media/types';
import { MUTE_REMOTE_PARTICIPANT } from '../participants/actionTypes';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import {
    REMOTE_PARTICIPANT_AUDIO_MUTE_CHANGED,
    REMOTE_PARTICIPANT_VIDEO_MUTE_CHANGED,
    TRACK_ADDED,
    TRACK_MUTE_UNMUTE_FAILED,
    TRACK_NO_DATA_FROM_SOURCE,
    TRACK_REMOVED,
    TRACK_STOPPED,
    TRACK_UPDATED
} from './actionTypes';
import {
    trackModeratorMuteCleared,
    trackModeratorMuteInitiated,
    trackMuteStateCleared,
    trackMuteStateUpdated
} from './actions.any';
import {
    createLocalTracksA,
    showNoDataFromSourceVideoError,
    toggleScreensharing,
    trackMuteUnmuteFailed,
    trackNoDataFromSourceNotificationInfoChanged
} from './actions.web';
import {
    getLocalJitsiAudioTrackSettings,
    getLocalTrack,
    getTrackByJitsiTrack, isUserInteractionRequiredForUnmute, logTracksForParticipant,
    setTrackMuted
} from './functions.web';
import { getPreviousMuteState, wasModeratorInitiated } from './reducer';
import { ITrack, ITrackOptions } from './types';
import './middleware.any';
import './subscriber.web';

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
    case MUTE_REMOTE_PARTICIPANT: {
        // Track moderator-initiated mutes in Redux state
        store.dispatch(trackModeratorMuteInitiated(action.id, action.mediaType));

        // Note: This will be cleared when the corresponding mute event fires:
        // - REMOTE_PARTICIPANT_AUDIO_MUTE_CHANGED (for remote participants)
        // - REMOTE_PARTICIPANT_VIDEO_MUTE_CHANGED (for remote participants)
        // Or when participant leaves (TRACK_REMOVED)
        break;
    }

    case REMOTE_PARTICIPANT_AUDIO_MUTE_CHANGED: {
        const { participantId, muted } = action;
        const mediaType = 'audio';
        const state = store.getState();

        // Check if this was a moderator-initiated mute using selector
        const wasModeratorMute = wasModeratorInitiated(state, participantId, mediaType);

        if (wasModeratorMute) {
            store.dispatch(trackModeratorMuteCleared(participantId, mediaType));
        }

        const isSelfMuted = !wasModeratorMute;

        APP.API.notifyParticipantMuted(participantId, muted, mediaType, isSelfMuted);
        break;
    }

    case REMOTE_PARTICIPANT_VIDEO_MUTE_CHANGED: {
        const { participantId, muted } = action;
        const mediaType = 'video';
        const state = store.getState();

        // Check if this was a moderator-initiated mute using selector
        const wasModeratorMute = wasModeratorInitiated(state, participantId, mediaType);

        if (wasModeratorMute) {
            store.dispatch(trackModeratorMuteCleared(participantId, mediaType));
        }

        const isSelfMuted = !wasModeratorMute;

        APP.API.notifyParticipantMuted(participantId, muted, mediaType, isSelfMuted);
        break;
    }

    case TRACK_ADDED: {
        const { local, jitsiTrack } = action.track;

        // The devices list needs to be refreshed when no initial video permissions
        // were granted and a local video track is added by umuting the video.
        if (local) {
            store.dispatch(getAvailableDevices());

            // Store initial muted state for local participant
            const state = store.getState();
            const localParticipant = state['features/base/participants']?.local;

            if (localParticipant?.id && jitsiTrack) {
                const participantID = localParticipant.id;
                const isVideoTrack = jitsiTrack.getType() !== MEDIA_TYPE.AUDIO;
                const mediaType = isVideoTrack
                    ? (jitsiTrack.getVideoType() === VIDEO_TYPE.DESKTOP ? 'desktop' : 'video')
                    : 'audio';
                const currentMuted = jitsiTrack.isMuted();

                store.dispatch(trackMuteStateUpdated(participantID, mediaType, currentMuted));
            }

            break;
        }

        const result = next(action);
        const participantId = action.track?.participantId;

        if (participantId) {
            logTracksForParticipant(store.getState()['features/base/tracks'].tracks, participantId, 'Track added');
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
        const isLocal = action.track?.jitsiTrack?.isLocal();

        if (participantId) {
            logTracksForParticipant(store.getState()['features/base/tracks'].tracks, participantId, 'Track removed');

            const jitsiTrack = action.track.jitsiTrack;
            const isVideoTrack = jitsiTrack.type !== MEDIA_TYPE.AUDIO;
            const mediaType = isVideoTrack
                ? (jitsiTrack.getVideoType() === VIDEO_TYPE.DESKTOP ? 'desktop' : 'video')
                : 'audio';

            if (isLocal) {
                // Clean up previous-mute-states for local participant
                store.dispatch(trackMuteStateCleared(participantId, mediaType));
            } else {
                // Clean up moderator-mutes tracking for remote participant
                store.dispatch(trackModeratorMuteCleared(participantId, mediaType));
            }
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

        // Local participant mute/unmute is now handled via SET_AUDIO_MUTED and SET_VIDEO_MUTED
        // Remote participant mute/unmute events are handled via
        // REMOTE_PARTICIPANT_AUDIO_MUTE_CHANGED and REMOTE_PARTICIPANT_VIDEO_MUTE_CHANGED
        // which are more reliable as they're based on XMPP signaling rather than track updates

        return result;
    }
    case SET_AUDIO_MUTED: {
        if (!action.muted
                && isUserInteractionRequiredForUnmute(store.getState())) {
            return;
        }

        // Get the current muted state BEFORE the action executes
        const stateBefore = store.getState();
        const localParticipant = stateBefore['features/base/participants']?.local;

        const result = next(action);

        // Skip events if prejoin page is visible
        const state = store.getState();

        if (isPrejoinPageVisible(state)) {
            _setMuted(store, action);

            return result;
        }

        // Fire external API event for local participant audio mute/unmute
        if (localParticipant?.id) {
            const participantID = localParticipant.id;
            const mediaType = 'audio';
            const currentMuted = action.muted;

            // Get the previously notified state from Redux to prevent duplicates
            const stateAfter = store.getState();
            const previousNotifiedMuted = getPreviousMuteState(stateAfter, participantID, mediaType);

            // Fire event ONLY if different from what we last notified about
            if (previousNotifiedMuted !== currentMuted) {
                APP.API.notifyParticipantMuted(participantID, currentMuted, mediaType, true);

                // Update previous state to prevent duplicates
                store.dispatch(trackMuteStateUpdated(participantID, mediaType, currentMuted));
            }
        }

        _setMuted(store, action);

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

    const track = getTrackByJitsiTrack(getState()['features/base/tracks'].tracks, action.track.jitsiTrack);

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
    const t = getTrackByJitsiTrack(getState()['features/base/tracks'].tracks, track.jitsiTrack);
    const { jitsiTrack, noDataFromSourceNotificationInfo = {} } = t || {};

    if (noDataFromSourceNotificationInfo?.uid) {
        dispatch(hideNotification(noDataFromSourceNotificationInfo.uid));
        dispatch(trackNoDataFromSourceNotificationInfoChanged(jitsiTrack, undefined));
    }
}

/**
 * Mutes or unmutes a local track with a specific media type.
 *
 * @param {Store} store - The redux store in which the specified action is
 * dispatched.
 * @param {Action} action - The redux action dispatched in the specified store.
 * @private
 * @returns {void}
 */
function _setMuted(store: IStore, { ensureTrack, muted }: {
    ensureTrack: boolean; muted: boolean; }) {
    const { dispatch, getState } = store;
    const state = getState();
    const localTrack = getLocalTrack(state['features/base/tracks'].tracks, MEDIA_TYPE.AUDIO, /* includePending */ true);

    if (localTrack) {
        // The `jitsiTrack` property will have a value only for a localTrack for which `getUserMedia` has already
        // completed. If there's no `jitsiTrack`, then the `muted` state will be applied once the `jitsiTrack` is
        // created.
        const { jitsiTrack } = localTrack;

        if (jitsiTrack) {
            setTrackMuted(jitsiTrack, muted, state, dispatch)
            .catch(() => {
                dispatch(trackMuteUnmuteFailed(localTrack, muted));
            });
        }
    } else if (!muted && ensureTrack) {
        // TODO(saghul): reconcile these 2 types.
        dispatch(gumPending([ MEDIA_TYPE.AUDIO ], IGUMPendingState.PENDING_UNMUTE));

        const createTrackOptions: ITrackOptions = {
            devices: [ MEDIA_TYPE.AUDIO ],
        };

        dispatch(createLocalTracksA(createTrackOptions)).then(() => {
            dispatch(gumPending([ MEDIA_TYPE.AUDIO ], IGUMPendingState.NONE));
            const updatedSettings = getLocalJitsiAudioTrackSettings(getState());

            dispatch(setAudioSettings(updatedSettings));
        });
    }
}

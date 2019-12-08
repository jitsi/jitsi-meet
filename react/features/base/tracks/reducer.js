import { PARTICIPANT_ID_CHANGED } from '../participants';
import { ReducerRegistry, set } from '../redux';

import {
    SET_NO_SRC_DATA_NOTIFICATION_UID,
    TRACK_ADDED,
    TRACK_CREATE_CANCELED,
    TRACK_CREATE_ERROR,
    TRACK_NO_DATA_FROM_SOURCE,
    TRACK_REMOVED,
    TRACK_UPDATED,
    TRACK_WILL_CREATE
} from './actionTypes';

/**
 * @typedef {Object} Track
 * @property {(JitsiLocalTrack|JitsiRemoteTrack)} [jitsiTrack] - The associated
 * {@code JitsiTrack} instance. Optional for local tracks if those are still
 * being created (i.e. {@code getUserMedia} is still in progress).
 * @property {Promise} [gumProcess] - If a local track is still being created,
 * it will have no {@code JitsiTrack}, but a {@code gumProcess} set to a
 * {@code Promise} with and extra {@code cancel()}.
 * @property {boolean} local=false - If the track is local.
 * @property {MEDIA_TYPE} mediaType=false - The media type of the track.
 * @property {boolean} mirror=false - The indicator which determines whether the
 * display/rendering of the track should be mirrored. It only makes sense in the
 * context of video (at least at the time of this writing).
 * @property {boolean} muted=false - If the track is muted.
 * @property {(string|undefined)} participantId - The ID of the participant whom
 * the track belongs to.
 * @property {boolean} videoStarted=false - If the video track has already
 * started to play.
 * @property {(VIDEO_TYPE|undefined)} videoType - The type of video track if
 * any.
 */

/**
 * Reducer function for a single track.
 *
 * @param {Track|undefined} state - Track to be modified.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @param {string} action.newValue - New participant ID value (in this
 * particular case).
 * @param {string} action.oldValue - Old participant ID value (in this
 * particular case).
 * @param {Track} action.track - Information about track to be changed.
 * @param {Participant} action.participant - Information about participant.
 * @returns {Track|undefined}
 */
function track(state, action) {
    switch (action.type) {
    case PARTICIPANT_ID_CHANGED:
        if (state.participantId === action.oldValue) {
            return {
                ...state,
                participantId: action.newValue
            };
        }
        break;

    case TRACK_UPDATED: {
        const t = action.track;

        if (state.jitsiTrack === t.jitsiTrack) {
            // Make sure that there's an actual update in order to reduce the
            // risk of unnecessary React Component renders.
            for (const p in t) {
                if (state[p] !== t[p]) {
                    // There's an actual update.
                    return {
                        ...state,
                        ...t
                    };
                }
            }
        }
        break;
    }
    case TRACK_NO_DATA_FROM_SOURCE: {
        const t = action.track;

        if (state.jitsiTrack === t.jitsiTrack) {
            const isReceivingData = t.jitsiTrack.isReceivingData();

            if (state.isReceivingData !== isReceivingData) {
                return {
                    ...state,
                    isReceivingData
                };
            }
        }
        break;
    }
    }

    return state;
}

/**
 * Listen for actions that mutate (e.g. add, remove) local and remote tracks.
 */
ReducerRegistry.register('features/base/tracks', (state = [], action) => {
    switch (action.type) {
    case PARTICIPANT_ID_CHANGED:
    case TRACK_NO_DATA_FROM_SOURCE:
    case TRACK_UPDATED:
        return state.map(t => track(t, action));

    case TRACK_ADDED: {
        let withoutTrackStub = state;

        if (action.track.local) {
            withoutTrackStub
                = state.filter(
                    t => !t.local || t.mediaType !== action.track.mediaType);
        }

        return [ ...withoutTrackStub, action.track ];
    }

    case TRACK_CREATE_CANCELED:
    case TRACK_CREATE_ERROR: {
        return state.filter(t => !t.local || t.mediaType !== action.trackType);
    }

    case TRACK_REMOVED:
        return state.filter(t => t.jitsiTrack !== action.track.jitsiTrack);

    case TRACK_WILL_CREATE:
        return [ ...state, action.track ];

    default:
        return state;
    }
});

/**
 * Listen for actions that mutate the no-src-data state, like the current notification id
 */
ReducerRegistry.register('features/base/no-src-data', (state = {}, action) => {
    switch (action.type) {
    case SET_NO_SRC_DATA_NOTIFICATION_UID:
        return set(state, 'noSrcDataNotificationUid', action.uid);

    default:
        return state;
    }
});


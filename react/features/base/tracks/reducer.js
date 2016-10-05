import { PARTICIPANT_ID_CHANGED } from '../participants';
import { ReducerRegistry } from '../redux';

import {
    TRACK_ADDED,
    TRACK_REMOVED,
    TRACK_UPDATED
} from './actionTypes';

/**
 * @typedef {Object} Track
 * @property {(JitsiLocalTrack|JitsiRemoteTrack)} jitsiTrack - JitsiTrack
 * instance.
 * @property {boolean} local=false - If track is local.
 * @property {MEDIA_TYPE} mediaType=false - Media type of track.
 * @property {boolean} mirrorVideo=false - If video track should be mirrored.
 * @property {boolean} muted=false - If track is muted.
 * @property {(string|undefined)} participantId - ID of participant whom this
 * track belongs to.
 * @property {boolean} videoStarted=false - If video track has already started
 * to play.
 * @property {(VIDEO_TYPE|undefined)} videoType - Type of video track if any.
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
    }

    return state;
}

/**
 * Listen for actions that mutate (e.g. add, remove) local and remote tracks.
 */
ReducerRegistry.register('features/base/tracks', (state = [], action) => {
    switch (action.type) {
    case PARTICIPANT_ID_CHANGED:
    case TRACK_UPDATED:
        return state.map(t => track(t, action));

    case TRACK_ADDED:
        return [
            ...state,
            action.track
        ];

    case TRACK_REMOVED:
        return state.filter(t => t.jitsiTrack !== action.track.jitsiTrack);

    default:
        return state;
    }
});

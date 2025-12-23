import { AnyAction } from 'redux';

import { PARTICIPANT_ID_CHANGED } from '../participants/actionTypes';
import ReducerRegistry from '../redux/ReducerRegistry';
import { set } from '../redux/functions';

import {
    SET_NO_SRC_DATA_NOTIFICATION_UID,
    TRACK_ADDED,
    TRACK_CREATE_CANCELED,
    TRACK_CREATE_ERROR,
    TRACK_MODERATOR_MUTE_CLEARED,
    TRACK_MODERATOR_MUTE_INITIATED,
    TRACK_MUTE_STATE_CLEARED,
    TRACK_MUTE_STATE_UPDATED,
    TRACK_NO_DATA_FROM_SOURCE,
    TRACK_REMOVED,
    TRACK_UPDATED,
    TRACK_WILL_CREATE
} from './actionTypes';
import { ITrack } from './types';

/**
 * Reducer function for a single track.
 *
 * @param {Track|undefined} state - Track to be modified.
 * @param {Object} action - Action object.
 * @param {string} action.type - Type of action.
 * @param {string} action.name - Name of last media event.
 * @param {string} action.newValue - New participant ID value (in this
 * particular case).
 * @param {string} action.oldValue - Old participant ID value (in this
 * particular case).
 * @param {Track} action.track - Information about track to be changed.
 * @param {Participant} action.participant - Information about participant.
 * @returns {Track|undefined}
 */
function track(state: ITrack, action: AnyAction) {
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
                // @ts-ignore
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

export interface ITrackMuteInfo {
    moderatorInitiated?: boolean;
    previousMuted?: boolean;
}

export interface ITracksState {
    muteTracking: {
        [key: string]: ITrackMuteInfo;
    };
    tracks: ITrack[];
}

const DEFAULT_STATE: ITracksState = {
    muteTracking: {},
    tracks: []
};

/**
 * Listen for actions that mutate (e.g. Add, remove) local and remote tracks.
 */
ReducerRegistry.register<ITracksState>('features/base/tracks', (state = DEFAULT_STATE, action): ITracksState => {
    switch (action.type) {
    case PARTICIPANT_ID_CHANGED:
    case TRACK_NO_DATA_FROM_SOURCE:
    case TRACK_UPDATED:
        return {
            ...state,
            tracks: state.tracks.map((t: ITrack) => track(t, action))
        };
    case TRACK_ADDED: {
        let withoutTrackStub = state.tracks;

        if (action.track.local) {
            withoutTrackStub
                = state.tracks.filter(
                    (t: ITrack) => !t.local || t.mediaType !== action.track.mediaType);
        }

        return {
            ...state,
            tracks: [ ...withoutTrackStub, action.track ]
        };
    }

    case TRACK_CREATE_CANCELED:
    case TRACK_CREATE_ERROR: {
        return {
            ...state,
            tracks: state.tracks.filter((t: ITrack) => !t.local || t.mediaType !== action.trackType)
        };
    }

    case TRACK_REMOVED:
        return {
            ...state,
            tracks: state.tracks.filter((t: ITrack) => t.jitsiTrack !== action.track.jitsiTrack)
        };

    case TRACK_WILL_CREATE:
        return {
            ...state,
            tracks: [ ...state.tracks, action.track ]
        };

    case TRACK_MODERATOR_MUTE_INITIATED: {
        const key = `${action.participantId}-${action.mediaType}`;

        return {
            ...state,
            muteTracking: {
                ...state.muteTracking,
                [key]: {
                    ...state.muteTracking[key],
                    moderatorInitiated: true
                }
            }
        };
    }

    case TRACK_MODERATOR_MUTE_CLEARED: {
        const key = `${action.participantId}-${action.mediaType}`;

        if (!state.muteTracking[key]) {
            return state;
        }

        return {
            ...state,
            muteTracking: {
                ...state.muteTracking,
                [key]: {
                    ...state.muteTracking[key],
                    moderatorInitiated: undefined
                }
            }
        };
    }

    case TRACK_MUTE_STATE_UPDATED: {
        const key = `${action.participantId}-${action.mediaType}`;

        return {
            ...state,
            muteTracking: {
                ...state.muteTracking,
                [key]: {
                    ...state.muteTracking[key],
                    previousMuted: action.muted
                }
            }
        };
    }

    case TRACK_MUTE_STATE_CLEARED: {
        const key = `${action.participantId}-${action.mediaType}`;
        const newMuteTracking = { ...state.muteTracking };

        delete newMuteTracking[key];

        return {
            ...state,
            muteTracking: newMuteTracking
        };
    }

    default:
        return state;
    }
});

export interface INoSrcDataState {
    noSrcDataNotificationUid?: string | number;
}

/**
 * Listen for actions that mutate the no-src-data state, like the current notification id.
 */
ReducerRegistry.register<INoSrcDataState>('features/base/no-src-data', (state = {}, action): INoSrcDataState => {
    switch (action.type) {
    case SET_NO_SRC_DATA_NOTIFICATION_UID:
        return set(state, 'noSrcDataNotificationUid', action.uid);

    default:
        return state;
    }
});

/**
 * Selector to check if a mute was moderator-initiated.
 *
 * @param {Object} state - The Redux state.
 * @param {string} participantId - The participant ID.
 * @param {string} mediaType - The media type.
 * @returns {boolean} True if moderator-initiated.
 */
export function wasModeratorInitiated(state: any, participantId: string, mediaType: string): boolean {
    const key = `${participantId}-${mediaType}`;
    const tracksState: ITracksState = state['features/base/tracks'];

    return tracksState.muteTracking[key]?.moderatorInitiated ?? false;
}

/**
 * Selector to get the previous mute state.
 *
 * @param {Object} state - The Redux state.
 * @param {string} participantId - The participant ID.
 * @param {string} mediaType - The media type.
 * @returns {boolean|undefined} Previous muted state, or undefined if not tracked.
 */
export function getPreviousMuteState(state: any, participantId: string, mediaType: string): boolean | undefined {
    const key = `${participantId}-${mediaType}`;
    const tracksState: ITracksState = state['features/base/tracks'];

    return tracksState.muteTracking[key]?.previousMuted;
}

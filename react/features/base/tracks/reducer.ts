import { AnyAction } from 'redux';

import { PARTICIPANT_ID_CHANGED } from '../participants/actionTypes';
import ReducerRegistry from '../redux/ReducerRegistry';
import { set } from '../redux/functions';

import {
    SET_NO_SRC_DATA_NOTIFICATION_UID,
    TRACK_ADDED,
    TRACK_CREATE_CANCELED,
    TRACK_CREATE_ERROR,
    TRACK_NO_DATA_FROM_SOURCE,
    TRACK_OWNER_CHANGED,
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

    case TRACK_OWNER_CHANGED: {
        const t = action.track;

        if (state.jitsiTrack === t.jitsiTrack) {
            return {
                ...state,
                participantId: t.participantId
            };
        }
        break;
    }

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

export type ITracksState = ITrack[];

/**
 * Listen for actions that mutate (e.g. Add, remove) local and remote tracks.
 */
ReducerRegistry.register<ITracksState>('features/base/tracks', (state = [], action): ITracksState => {
    switch (action.type) {
    case PARTICIPANT_ID_CHANGED:
    case TRACK_NO_DATA_FROM_SOURCE:
    case TRACK_OWNER_CHANGED:
    case TRACK_UPDATED:
        return state.map((t: ITrack) => track(t, action));
    case TRACK_ADDED: {
        let withoutTrackStub = state;

        if (action.track.local) {
            withoutTrackStub
                = state.filter(
                    (t: ITrack) => !t.local || t.mediaType !== action.track.mediaType);
        }

        return [ ...withoutTrackStub, action.track ];
    }

    case TRACK_CREATE_CANCELED:
    case TRACK_CREATE_ERROR: {
        return state.filter((t: ITrack) => !t.local || t.mediaType !== action.trackType);
    }

    case TRACK_REMOVED:
        return state.filter((t: ITrack) => t.jitsiTrack !== action.track.jitsiTrack);

    case TRACK_WILL_CREATE:
        return [ ...state, action.track ];

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


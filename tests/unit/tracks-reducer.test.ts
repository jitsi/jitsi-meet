import { describe, expect, it } from 'vitest';

import { PARTICIPANT_ID_CHANGED } from '../../react/features/base/participants/actionTypes';
import ReducerRegistry from '../../react/features/base/redux/ReducerRegistry';
import {
    SET_NO_SRC_DATA_NOTIFICATION_UID,
    TRACK_ADDED,
    TRACK_CREATE_CANCELED,
    TRACK_CREATE_ERROR,
    TRACK_REMOVED,
    TRACK_UPDATED,
    TRACK_WILL_CREATE
} from '../../react/features/base/tracks/actionTypes';
import '../../react/features/base/tracks/reducer';

describe('Tracks Reducer Unit Tests', () => {
    const tracksReducer = ReducerRegistry._elements['features/base/tracks'];
    const noSrcDataReducer = ReducerRegistry._elements['features/base/no-src-data'];

    it('is registered in ReducerRegistry', () => {
        expect(tracksReducer).toBeDefined();
        expect(noSrcDataReducer).toBeDefined();
    });

    it('returns empty array as default state', () => {
        const state = tracksReducer(undefined, { type: 'UNKNOWN_ACTION' });

        expect(state).toEqual([]);
    });

    it('adds remote track on TRACK_ADDED', () => {
        const mockRemoteTrack = {
            jitsiTrack: { id: 'remote-track-1' },
            local: false,
            mediaType: 'video',
            participantId: 'remote-part-1'
        };

        const state = tracksReducer([], {
            track: mockRemoteTrack,
            type: TRACK_ADDED
        });

        expect(state.length).toBe(1);
        expect(state[0]).toBe(mockRemoteTrack);
    });

    it('replaces local track stub when new local track of same media type is added', () => {
        const localTrackStub = {
            jitsiTrack: null,
            local: true,
            mediaType: 'video',
            participantId: 'local-user'
        };

        const realLocalTrack = {
            jitsiTrack: { id: 'real-local-video-track' },
            local: true,
            mediaType: 'video',
            participantId: 'local-user'
        };

        const initialState = [ localTrackStub ];
        const nextState = tracksReducer(initialState as any, {
            track: realLocalTrack,
            type: TRACK_ADDED
        });

        expect(nextState.length).toBe(1);
        expect(nextState[0].jitsiTrack).toBe(realLocalTrack.jitsiTrack);
    });

    it('removes track matching jitsiTrack reference on TRACK_REMOVED', () => {
        const track1 = { jitsiTrack: { id: 'track-1' }, local: true };
        const track2 = { jitsiTrack: { id: 'track-2' }, local: false };
        const initialState = [ track1, track2 ];

        const nextState = tracksReducer(initialState as any, {
            track: { jitsiTrack: track1.jitsiTrack },
            type: TRACK_REMOVED
        });

        expect(nextState.length).toBe(1);
        expect(nextState[0]).toBe(track2);
    });

    it('updates track properties on TRACK_UPDATED', () => {
        const originalTrack = {
            jitsiTrack: { id: 'track-1' },
            muted: false,
            videoType: 'camera'
        };
        const initialState = [ originalTrack ];

        const nextState = tracksReducer(initialState as any, {
            track: {
                jitsiTrack: originalTrack.jitsiTrack,
                muted: true
            },
            type: TRACK_UPDATED
        });

        expect(nextState.length).toBe(1);
        expect(nextState[0].muted).toBe(true);
        expect(nextState[0].videoType).toBe('camera');
    });

    it('updates participantId on PARTICIPANT_ID_CHANGED', () => {
        const participantTrack = {
            jitsiTrack: { id: 'track-1' },
            participantId: 'old-endpoint-id'
        };
        const initialState = [ participantTrack ];

        const nextState = tracksReducer(initialState as any, {
            newValue: 'new-endpoint-id',
            oldValue: 'old-endpoint-id',
            type: PARTICIPANT_ID_CHANGED
        });

        expect(nextState.length).toBe(1);
        expect(nextState[0].participantId).toBe('new-endpoint-id');
    });

    it('removes local track stub on TRACK_CREATE_CANCELED and TRACK_CREATE_ERROR', () => {
        const localAudioTrack = { local: true, mediaType: 'audio' };
        const localVideoTrack = { local: true, mediaType: 'video' };
        const initialState = [ localAudioTrack, localVideoTrack ];

        const stateAfterCancel = tracksReducer(initialState as any, {
            trackType: 'audio',
            type: TRACK_CREATE_CANCELED
        });

        expect(stateAfterCancel.length).toBe(1);
        expect(stateAfterCancel[0].mediaType).toBe('video');

        const stateAfterError = tracksReducer(initialState as any, {
            trackType: 'video',
            type: TRACK_CREATE_ERROR
        });

        expect(stateAfterError.length).toBe(1);
        expect(stateAfterError[0].mediaType).toBe('audio');
    });

    it('adds pending track on TRACK_WILL_CREATE', () => {
        const pendingTrack = { local: true, mediaType: 'audio' };
        const nextState = tracksReducer([], {
            track: pendingTrack,
            type: TRACK_WILL_CREATE
        });

        expect(nextState.length).toBe(1);
        expect(nextState[0]).toBe(pendingTrack);
    });

    describe('no-src-data reducer', () => {
        it('sets notification uid on SET_NO_SRC_DATA_NOTIFICATION_UID', () => {
            const nextState = noSrcDataReducer(undefined, {
                type: SET_NO_SRC_DATA_NOTIFICATION_UID,
                uid: 'notif-xyz-123'
            });

            expect(nextState.noSrcDataNotificationUid).toBe('notif-xyz-123');
        });
    });
});

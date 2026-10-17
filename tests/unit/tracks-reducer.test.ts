import { describe, it } from 'node:test';
import assert from 'node:assert';

import ReducerRegistry from '../../react/features/base/redux/ReducerRegistry';
import '../../react/features/base/tracks/reducer';
import {
    SET_NO_SRC_DATA_NOTIFICATION_UID,
    TRACK_ADDED,
    TRACK_CREATE_CANCELED,
    TRACK_CREATE_ERROR,
    TRACK_REMOVED,
    TRACK_UPDATED,
    TRACK_WILL_CREATE
} from '../../react/features/base/tracks/actionTypes';
import { PARTICIPANT_ID_CHANGED } from '../../react/features/base/participants/actionTypes';

describe('Tracks Reducer Unit Tests', () => {
    const tracksReducer = ReducerRegistry._elements['features/base/tracks'];
    const noSrcDataReducer = ReducerRegistry._elements['features/base/no-src-data'];

    it('is registered in ReducerRegistry', () => {
        assert.ok(tracksReducer, 'features/base/tracks should be registered');
        assert.ok(noSrcDataReducer, 'features/base/no-src-data should be registered');
    });

    it('returns empty array as default state', () => {
        const state = tracksReducer(undefined, { type: 'UNKNOWN_ACTION' });
        assert.deepStrictEqual(state, []);
    });

    it('adds remote track on TRACK_ADDED', () => {
        const mockRemoteTrack = {
            jitsiTrack: { id: 'remote-track-1' },
            local: false,
            mediaType: 'video',
            participantId: 'remote-part-1'
        };

        const state = tracksReducer([], {
            type: TRACK_ADDED,
            track: mockRemoteTrack
        });

        assert.strictEqual(state.length, 1);
        assert.strictEqual(state[0], mockRemoteTrack);
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
            type: TRACK_ADDED,
            track: realLocalTrack
        });

        assert.strictEqual(nextState.length, 1);
        assert.strictEqual(nextState[0].jitsiTrack, realLocalTrack.jitsiTrack);
    });

    it('removes track matching jitsiTrack reference on TRACK_REMOVED', () => {
        const track1 = { jitsiTrack: { id: 'track-1' }, local: true };
        const track2 = { jitsiTrack: { id: 'track-2' }, local: false };
        const initialState = [ track1, track2 ];

        const nextState = tracksReducer(initialState as any, {
            type: TRACK_REMOVED,
            track: { jitsiTrack: track1.jitsiTrack }
        });

        assert.strictEqual(nextState.length, 1);
        assert.strictEqual(nextState[0], track2);
    });

    it('updates track properties on TRACK_UPDATED', () => {
        const originalTrack = {
            jitsiTrack: { id: 'track-1' },
            muted: false,
            videoType: 'camera'
        };
        const initialState = [ originalTrack ];

        const nextState = tracksReducer(initialState as any, {
            type: TRACK_UPDATED,
            track: {
                jitsiTrack: originalTrack.jitsiTrack,
                muted: true
            }
        });

        assert.strictEqual(nextState.length, 1);
        assert.strictEqual(nextState[0].muted, true);
        assert.strictEqual(nextState[0].videoType, 'camera');
    });

    it('updates participantId on PARTICIPANT_ID_CHANGED', () => {
        const participantTrack = {
            jitsiTrack: { id: 'track-1' },
            participantId: 'old-endpoint-id'
        };
        const initialState = [ participantTrack ];

        const nextState = tracksReducer(initialState as any, {
            type: PARTICIPANT_ID_CHANGED,
            oldValue: 'old-endpoint-id',
            newValue: 'new-endpoint-id'
        });

        assert.strictEqual(nextState.length, 1);
        assert.strictEqual(nextState[0].participantId, 'new-endpoint-id');
    });

    it('removes local track stub on TRACK_CREATE_CANCELED and TRACK_CREATE_ERROR', () => {
        const localAudioTrack = { local: true, mediaType: 'audio' };
        const localVideoTrack = { local: true, mediaType: 'video' };
        const initialState = [ localAudioTrack, localVideoTrack ];

        const stateAfterCancel = tracksReducer(initialState as any, {
            type: TRACK_CREATE_CANCELED,
            trackType: 'audio'
        });
        assert.strictEqual(stateAfterCancel.length, 1);
        assert.strictEqual(stateAfterCancel[0].mediaType, 'video');

        const stateAfterError = tracksReducer(initialState as any, {
            type: TRACK_CREATE_ERROR,
            trackType: 'video'
        });
        assert.strictEqual(stateAfterError.length, 1);
        assert.strictEqual(stateAfterError[0].mediaType, 'audio');
    });

    it('adds pending track on TRACK_WILL_CREATE', () => {
        const pendingTrack = { local: true, mediaType: 'audio' };
        const nextState = tracksReducer([], {
            type: TRACK_WILL_CREATE,
            track: pendingTrack
        });

        assert.strictEqual(nextState.length, 1);
        assert.strictEqual(nextState[0], pendingTrack);
    });

    describe('no-src-data reducer', () => {
        it('sets notification uid on SET_NO_SRC_DATA_NOTIFICATION_UID', () => {
            const nextState = noSrcDataReducer(undefined, {
                type: SET_NO_SRC_DATA_NOTIFICATION_UID,
                uid: 'notif-xyz-123'
            });

            assert.strictEqual(nextState.noSrcDataNotificationUid, 'notif-xyz-123');
        });
    });
});

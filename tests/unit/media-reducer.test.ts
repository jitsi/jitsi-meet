import { describe, it } from 'node:test';
import assert from 'node:assert';

import ReducerRegistry from '../../react/features/base/redux/ReducerRegistry';
import '../../react/features/base/media/reducer';
import {
    GUM_PENDING,
    SET_AUDIO_AVAILABLE,
    SET_AUDIO_MUTED,
    SET_AUDIO_UNMUTE_PERMISSIONS,
    SET_CAMERA_FACING_MODE,
    SET_SCREENSHARE_MUTED,
    SET_VIDEO_AVAILABLE,
    SET_VIDEO_MUTED,
    SET_VIDEO_UNMUTE_PERMISSIONS,
    STORE_VIDEO_TRANSFORM,
    TOGGLE_CAMERA_FACING_MODE
} from '../../react/features/base/media/actionTypes';
import { CAMERA_FACING_MODE, MEDIA_TYPE } from '../../react/features/base/media/constants';
import { IGUMPendingState } from '../../react/features/base/media/types';

describe('Media Reducer Unit Tests', () => {
    const reducer = ReducerRegistry._elements['features/base/media'];

    it('is registered in ReducerRegistry', () => {
        assert.ok(reducer, 'Reducer should be registered under features/base/media');
    });

    it('returns default initial state for audio and video', () => {
        const state = reducer(undefined, { type: 'UNKNOWN_ACTION' });

        assert.ok(state.audio, 'State should have audio section');
        assert.ok(state.video, 'State should have video section');

        assert.strictEqual(state.audio.available, true);
        assert.strictEqual(state.audio.muted, false);
        assert.strictEqual(state.audio.unmuteBlocked, false);
        assert.strictEqual(state.audio.gumPending, IGUMPendingState.NONE);

        assert.strictEqual(state.video.available, true);
        assert.strictEqual(state.video.muted, 0);
        assert.strictEqual(state.video.facingMode, CAMERA_FACING_MODE.USER);
    });

    describe('audio media reducer', () => {
        it('updates audio availability on SET_AUDIO_AVAILABLE', () => {
            const nextState = reducer(undefined, {
                type: SET_AUDIO_AVAILABLE,
                available: false
            });

            assert.strictEqual(nextState.audio.available, false);
        });

        it('updates audio mute state on SET_AUDIO_MUTED', () => {
            const nextState = reducer(undefined, {
                type: SET_AUDIO_MUTED,
                muted: true
            });

            assert.strictEqual(nextState.audio.muted, true);
        });

        it('updates audio unmute permissions on SET_AUDIO_UNMUTE_PERMISSIONS', () => {
            const nextState = reducer(undefined, {
                type: SET_AUDIO_UNMUTE_PERMISSIONS,
                blocked: true
            });

            assert.strictEqual(nextState.audio.unmuteBlocked, true);
        });

        it('updates gumPending state for audio media type', () => {
            const nextState = reducer(undefined, {
                type: GUM_PENDING,
                mediaTypes: [ MEDIA_TYPE.AUDIO ],
                status: IGUMPendingState.PENDING_UNMUTE
            });

            assert.strictEqual(nextState.audio.gumPending, IGUMPendingState.PENDING_UNMUTE);
        });
    });

    describe('video media reducer', () => {
        it('updates video availability on SET_VIDEO_AVAILABLE', () => {
            const nextState = reducer(undefined, {
                type: SET_VIDEO_AVAILABLE,
                available: false
            });

            assert.strictEqual(nextState.video.available, false);
        });

        it('sets camera facing mode on SET_CAMERA_FACING_MODE', () => {
            const nextState = reducer(undefined, {
                type: SET_CAMERA_FACING_MODE,
                cameraFacingMode: CAMERA_FACING_MODE.ENVIRONMENT
            });

            assert.strictEqual(nextState.video.facingMode, CAMERA_FACING_MODE.ENVIRONMENT);
        });

        it('toggles camera facing mode between user and environment', () => {
            const toggledToEnv = reducer(undefined, {
                type: TOGGLE_CAMERA_FACING_MODE
            });
            assert.strictEqual(toggledToEnv.video.facingMode, CAMERA_FACING_MODE.ENVIRONMENT);

            const toggledBackToUser = reducer(toggledToEnv, {
                type: TOGGLE_CAMERA_FACING_MODE
            });
            assert.strictEqual(toggledBackToUser.video.facingMode, CAMERA_FACING_MODE.USER);
        });

        it('updates video mute state on SET_VIDEO_MUTED', () => {
            const nextState = reducer(undefined, {
                type: SET_VIDEO_MUTED,
                muted: 1
            });

            assert.strictEqual(nextState.video.muted, 1);
        });
        it('stores custom video transform on STORE_VIDEO_TRANSFORM', () => {
            const nextState = reducer(undefined, {
                type: STORE_VIDEO_TRANSFORM,
                streamId: 'stream-xyz',
                transform: { scaleX: -1 }
            });

            assert.deepStrictEqual(nextState.video.transforms['stream-xyz'], {
                scaleX: -1
            });
        });

        it('removes stored video transform when track is removed on TRACK_REMOVED', () => {
            const initialState: any = {
                video: {
                    transforms: {
                        'stream-xyz': { scaleX: -1 }
                    }
                }
            };

            const nextState = reducer(initialState, {
                type: 'TRACK_REMOVED',
                track: {
                    jitsiTrack: {
                        getStreamId: () => 'stream-xyz'
                    }
                }
            });

            assert.strictEqual(nextState.video.transforms['stream-xyz'], undefined);
        });

        it('clears all video transforms on CONFERENCE_LEFT', () => {
            const initialState: any = {
                video: {
                    transforms: {
                        'stream-1': { scaleX: -1 },
                        'stream-2': { scaleY: -1 }
                    }
                }
            };

            const nextState = reducer(initialState, {
                type: 'CONFERENCE_LEFT'
            });

            assert.deepStrictEqual(nextState.video.transforms, {});
        });

        it('updates video unmute blocked status on SET_VIDEO_UNMUTE_PERMISSIONS', () => {
            const nextState = reducer(undefined, {
                type: SET_VIDEO_UNMUTE_PERMISSIONS,
                blocked: true
            });

            assert.strictEqual(nextState.video.unmuteBlocked, true);
        });
    });
});

import { describe, expect, it } from 'vitest';

import {
    GUM_PENDING,
    SET_AUDIO_AVAILABLE,
    SET_AUDIO_MUTED,
    SET_AUDIO_UNMUTE_PERMISSIONS,
    SET_CAMERA_FACING_MODE,
    SET_VIDEO_AVAILABLE,
    SET_VIDEO_MUTED,
    SET_VIDEO_UNMUTE_PERMISSIONS,
    STORE_VIDEO_TRANSFORM,
    TOGGLE_CAMERA_FACING_MODE
} from '../../react/features/base/media/actionTypes';
import { CAMERA_FACING_MODE, MEDIA_TYPE } from '../../react/features/base/media/constants';
import '../../react/features/base/media/reducer';
import { IGUMPendingState } from '../../react/features/base/media/types';
import ReducerRegistry from '../../react/features/base/redux/ReducerRegistry';

describe('Media Reducer Unit Tests', () => {
    const reducer = ReducerRegistry._elements['features/base/media'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('returns default initial state for audio and video', () => {
        const state = reducer(undefined, { type: 'UNKNOWN_ACTION' });

        expect(state.audio).toBeDefined();
        expect(state.video).toBeDefined();

        expect(state.audio.available).toBe(true);
        expect(state.audio.muted).toBe(false);
        expect(state.audio.unmuteBlocked).toBe(false);
        expect(state.audio.gumPending).toBe(IGUMPendingState.NONE);

        expect(state.video.available).toBe(true);
        expect(state.video.muted).toBe(0);
        expect(state.video.facingMode).toBe(CAMERA_FACING_MODE.USER);
    });

    describe('audio media reducer', () => {
        it('updates audio availability on SET_AUDIO_AVAILABLE', () => {
            const nextState = reducer(undefined, {
                type: SET_AUDIO_AVAILABLE,
                available: false
            });

            expect(nextState.audio.available).toBe(false);
        });

        it('updates audio mute state on SET_AUDIO_MUTED', () => {
            const nextState = reducer(undefined, {
                type: SET_AUDIO_MUTED,
                muted: true
            });

            expect(nextState.audio.muted).toBe(true);
        });

        it('updates audio unmute permissions on SET_AUDIO_UNMUTE_PERMISSIONS', () => {
            const nextState = reducer(undefined, {
                type: SET_AUDIO_UNMUTE_PERMISSIONS,
                blocked: true
            });

            expect(nextState.audio.unmuteBlocked).toBe(true);
        });

        it('updates gumPending state for audio media type', () => {
            const nextState = reducer(undefined, {
                mediaTypes: [ MEDIA_TYPE.AUDIO ],
                status: IGUMPendingState.PENDING_UNMUTE,
                type: GUM_PENDING
            });

            expect(nextState.audio.gumPending).toBe(IGUMPendingState.PENDING_UNMUTE);
        });
    });

    describe('video media reducer', () => {
        it('updates video availability on SET_VIDEO_AVAILABLE', () => {
            const nextState = reducer(undefined, {
                available: false,
                type: SET_VIDEO_AVAILABLE
            });

            expect(nextState.video.available).toBe(false);
        });

        it('sets camera facing mode on SET_CAMERA_FACING_MODE', () => {
            const nextState = reducer(undefined, {
                cameraFacingMode: CAMERA_FACING_MODE.ENVIRONMENT,
                type: SET_CAMERA_FACING_MODE
            });

            expect(nextState.video.facingMode).toBe(CAMERA_FACING_MODE.ENVIRONMENT);
        });

        it('toggles camera facing mode between user and environment', () => {
            const toggledToEnv = reducer(undefined, {
                type: TOGGLE_CAMERA_FACING_MODE
            });

            expect(toggledToEnv.video.facingMode).toBe(CAMERA_FACING_MODE.ENVIRONMENT);

            const toggledBackToUser = reducer(toggledToEnv, {
                type: TOGGLE_CAMERA_FACING_MODE
            });

            expect(toggledBackToUser.video.facingMode).toBe(CAMERA_FACING_MODE.USER);
        });

        it('updates video mute state on SET_VIDEO_MUTED', () => {
            const nextState = reducer(undefined, {
                muted: 1,
                type: SET_VIDEO_MUTED
            });

            expect(nextState.video.muted).toBe(1);
        });

        it('stores custom video transform on STORE_VIDEO_TRANSFORM', () => {
            const nextState = reducer(undefined, {
                streamId: 'stream-xyz',
                transform: { scaleX: -1 },
                type: STORE_VIDEO_TRANSFORM
            });

            expect(nextState.video.transforms['stream-xyz']).toEqual({
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
                track: {
                    jitsiTrack: {
                        getStreamId: () => 'stream-xyz'
                    }
                },
                type: 'TRACK_REMOVED'
            });

            expect(nextState.video.transforms['stream-xyz']).toBeUndefined();
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

            expect(nextState.video.transforms).toEqual({});
        });

        it('updates video unmute blocked status on SET_VIDEO_UNMUTE_PERMISSIONS', () => {
            const nextState = reducer(undefined, {
                blocked: true,
                type: SET_VIDEO_UNMUTE_PERMISSIONS
            });

            expect(nextState.video.unmuteBlocked).toBe(true);
        });
    });
});

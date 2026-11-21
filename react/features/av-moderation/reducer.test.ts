import { Reducer } from 'redux';
import { describe, expect, it } from 'vitest';

import ReducerRegistry from '../base/redux/ReducerRegistry';

import { DISABLE_MODERATION } from './actionTypes';
import { MEDIA_TYPE } from './constants';
import './reducer';

interface IAVModerationState {
    audioModerationEnabled: boolean;
    audioUnmuteApproved?: boolean | undefined;
    audioWhitelist: { [id: string]: boolean; };
    desktopModerationEnabled: boolean;
    desktopUnmuteApproved?: boolean | undefined;
    desktopWhitelist: { [id: string]: boolean; };
    pendingAudio: Array<{ id: string; }>;
    pendingDesktop: Array<{ id: string; }>;
    pendingVideo: Array<{ id: string; }>;
    videoModerationEnabled: boolean;
    videoUnmuteApproved?: boolean | undefined;
    videoWhitelist: { [id: string]: boolean; };
}

describe('AV Moderation Reducer - DISABLE_MODERATION regression tests', () => {
    const reducer: Reducer<IAVModerationState> = ReducerRegistry._elements['features/av-moderation'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('returns default state for unknown action', () => {
        const state = reducer(undefined, { type: 'UNKNOWN_ACTION' });

        expect(state).toEqual({
            audioModerationEnabled: false,
            desktopModerationEnabled: false,
            videoModerationEnabled: false,
            audioWhitelist: {},
            desktopWhitelist: {},
            videoWhitelist: {},
            pendingAudio: [],
            pendingDesktop: [],
            pendingVideo: []
        });
    });

    it('disabling AUDIO moderation preserves VIDEO and DESKTOP whitelists and pending queues', () => {
        const initialState: IAVModerationState = {
            audioModerationEnabled: true,
            audioUnmuteApproved: true,
            audioWhitelist: { 'participant-audio-approved': true },
            pendingAudio: [ { id: 'participant-audio-pending' } ],

            videoModerationEnabled: true,
            videoUnmuteApproved: true,
            videoWhitelist: { 'participant-video-approved': true },
            pendingVideo: [ { id: 'participant-video-pending' } ],

            desktopModerationEnabled: true,
            desktopUnmuteApproved: true,
            desktopWhitelist: { 'participant-desktop-approved': true },
            pendingDesktop: [ { id: 'participant-desktop-pending' } ]
        };

        Object.freeze(initialState);
        Object.freeze(initialState.audioWhitelist);
        Object.freeze(initialState.videoWhitelist);
        Object.freeze(initialState.desktopWhitelist);
        Object.freeze(initialState.pendingAudio);
        Object.freeze(initialState.pendingVideo);
        Object.freeze(initialState.pendingDesktop);

        const action = {
            type: DISABLE_MODERATION,
            mediaType: MEDIA_TYPE.AUDIO,
            actor: { id: 'moderator-id' }
        };
        const nextState = reducer(initialState, action);

        // 1. Verify AUDIO state is reset
        expect(nextState.audioModerationEnabled).toBe(false);
        expect(nextState.audioUnmuteApproved).toBeUndefined();
        expect(nextState.audioWhitelist).toEqual({});
        expect(nextState.pendingAudio).toEqual([]);

        // 2. Verify VIDEO state is preserved
        expect(nextState.videoModerationEnabled).toBe(true);
        expect(nextState.videoUnmuteApproved).toBe(true);
        expect(nextState.videoWhitelist).toEqual({ 'participant-video-approved': true });
        expect(nextState.pendingVideo).toEqual([ { id: 'participant-video-pending' } ]);

        // 3. Verify DESKTOP state is preserved
        expect(nextState.desktopModerationEnabled).toBe(true);
        expect(nextState.desktopUnmuteApproved).toBe(true);
        expect(nextState.desktopWhitelist).toEqual({ 'participant-desktop-approved': true });
        expect(nextState.pendingDesktop).toEqual([ { id: 'participant-desktop-pending' } ]);
    });

    it('disabling VIDEO moderation preserves AUDIO and DESKTOP state', () => {
        const initialState: IAVModerationState = {
            audioModerationEnabled: true,
            audioUnmuteApproved: true,
            audioWhitelist: { 'participant-audio-approved': true },
            pendingAudio: [ { id: 'participant-audio-pending' } ],

            videoModerationEnabled: true,
            videoUnmuteApproved: true,
            videoWhitelist: { 'participant-video-approved': true },
            pendingVideo: [ { id: 'participant-video-pending' } ],

            desktopModerationEnabled: true,
            desktopUnmuteApproved: true,
            desktopWhitelist: { 'participant-desktop-approved': true },
            pendingDesktop: [ { id: 'participant-desktop-pending' } ]
        };

        Object.freeze(initialState);
        Object.freeze(initialState.audioWhitelist);
        Object.freeze(initialState.videoWhitelist);
        Object.freeze(initialState.desktopWhitelist);
        Object.freeze(initialState.pendingAudio);
        Object.freeze(initialState.pendingVideo);
        Object.freeze(initialState.pendingDesktop);

        const action = {
            type: DISABLE_MODERATION,
            mediaType: MEDIA_TYPE.VIDEO,
            actor: { id: 'moderator-id' }
        };
        const nextState = reducer(initialState, action);

        // 1. Verify VIDEO state is reset
        expect(nextState.videoModerationEnabled).toBe(false);
        expect(nextState.videoUnmuteApproved).toBeUndefined();
        expect(nextState.videoWhitelist).toEqual({});
        expect(nextState.pendingVideo).toEqual([]);

        // 2. Verify AUDIO state is preserved
        expect(nextState.audioModerationEnabled).toBe(true);
        expect(nextState.audioUnmuteApproved).toBe(true);
        expect(nextState.audioWhitelist).toEqual({ 'participant-audio-approved': true });
        expect(nextState.pendingAudio).toEqual([ { id: 'participant-audio-pending' } ]);

        // 3. Verify DESKTOP state is preserved
        expect(nextState.desktopModerationEnabled).toBe(true);
        expect(nextState.desktopUnmuteApproved).toBe(true);
        expect(nextState.desktopWhitelist).toEqual({ 'participant-desktop-approved': true });
        expect(nextState.pendingDesktop).toEqual([ { id: 'participant-desktop-pending' } ]);
    });

    it('disabling DESKTOP moderation preserves AUDIO and VIDEO state', () => {
        const initialState: IAVModerationState = {
            audioModerationEnabled: true,
            audioUnmuteApproved: true,
            audioWhitelist: { 'participant-audio-approved': true },
            pendingAudio: [ { id: 'participant-audio-pending' } ],

            videoModerationEnabled: true,
            videoUnmuteApproved: true,
            videoWhitelist: { 'participant-video-approved': true },
            pendingVideo: [ { id: 'participant-video-pending' } ],

            desktopModerationEnabled: true,
            desktopUnmuteApproved: true,
            desktopWhitelist: { 'participant-desktop-approved': true },
            pendingDesktop: [ { id: 'participant-desktop-pending' } ]
        };

        Object.freeze(initialState);
        Object.freeze(initialState.audioWhitelist);
        Object.freeze(initialState.videoWhitelist);
        Object.freeze(initialState.desktopWhitelist);
        Object.freeze(initialState.pendingAudio);
        Object.freeze(initialState.pendingVideo);
        Object.freeze(initialState.pendingDesktop);

        const action = {
            type: DISABLE_MODERATION,
            mediaType: MEDIA_TYPE.DESKTOP,
            actor: { id: 'moderator-id' }
        };
        const nextState = reducer(initialState, action);

        // 1. Verify DESKTOP state is reset
        expect(nextState.desktopModerationEnabled).toBe(false);
        expect(nextState.desktopUnmuteApproved).toBeUndefined();
        expect(nextState.desktopWhitelist).toEqual({});
        expect(nextState.pendingDesktop).toEqual([]);

        // 2. Verify AUDIO state is preserved
        expect(nextState.audioModerationEnabled).toBe(true);
        expect(nextState.audioUnmuteApproved).toBe(true);
        expect(nextState.audioWhitelist).toEqual({ 'participant-audio-approved': true });
        expect(nextState.pendingAudio).toEqual([ { id: 'participant-audio-pending' } ]);

        // 3. Verify VIDEO state is preserved
        expect(nextState.videoModerationEnabled).toBe(true);
        expect(nextState.videoUnmuteApproved).toBe(true);
        expect(nextState.videoWhitelist).toEqual({ 'participant-video-approved': true });
        expect(nextState.pendingVideo).toEqual([ { id: 'participant-video-pending' } ]);
    });

    it('does not alter state when DISABLE_MODERATION has an unrecognized media type', () => {
        const initialState: IAVModerationState = {
            audioModerationEnabled: true,
            audioUnmuteApproved: true,
            audioWhitelist: { 'participant-audio-approved': true },
            pendingAudio: [ { id: 'participant-audio-pending' } ],

            videoModerationEnabled: true,
            videoUnmuteApproved: true,
            videoWhitelist: { 'participant-video-approved': true },
            pendingVideo: [ { id: 'participant-video-pending' } ],

            desktopModerationEnabled: true,
            desktopUnmuteApproved: true,
            desktopWhitelist: { 'participant-desktop-approved': true },
            pendingDesktop: [ { id: 'participant-desktop-pending' } ]
        };

        Object.freeze(initialState);

        const action = {
            type: DISABLE_MODERATION,
            mediaType: 'unrecognized_media' as any,
            actor: { id: 'moderator-id' }
        };
        const nextState = reducer(initialState, action);

        expect(nextState).toBe(initialState);
    });
});

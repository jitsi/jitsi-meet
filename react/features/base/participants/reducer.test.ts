// @vitest-environment happy-dom

import { AnyAction } from 'redux';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./functions', () => ({
    isLocalScreenshareParticipant: (p?: any) => p?.fakeParticipant === 'LocalScreenShare',
    isParticipantModerator: (p?: any) => p?.role === 'moderator',
    isRemoteScreenshareParticipant: (p?: any) => p?.fakeParticipant === 'RemoteScreenShare' || Boolean(p?.isVirtualScreenshareParticipant),
    isScreenShareParticipant: (p?: any) => p?.fakeParticipant === 'LocalScreenShare'
        || p?.fakeParticipant === 'RemoteScreenShare'
        || Boolean(p?.isVirtualScreenshareParticipant)
}));

import ReducerRegistry from '../redux/ReducerRegistry';

import {
    DOMINANT_SPEAKER_CHANGED,
    OVERWRITE_PARTICIPANT_NAME,
    PARTICIPANT_ID_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_UPDATED,
    PIN_PARTICIPANT,
    RAISE_HAND_CLEAR,
    RAISE_HAND_UPDATED,
    SCREENSHARE_PARTICIPANT_NAME_CHANGED
} from './actionTypes';
import { LOCAL_PARTICIPANT_DEFAULT_ID, PARTICIPANT_ROLE } from './constants';
import './reducer';

/**
 * Returns a clean initial state object to prevent test state pollution.
 *
 * @returns {Object} Fresh initial participants state.
 */
function getInitialState() {
    return {
        activeSpeakers: new Set<string>(),
        dominantSpeaker: undefined,
        fakeParticipants: new Map(),
        local: undefined,
        localScreenShare: undefined,
        numberOfNonModeratorParticipants: 0,
        numberOfParticipantsDisabledE2EE: 0,
        numberOfParticipantsNotSupportingE2EE: 0,
        overwrittenNameList: {},
        pinnedParticipant: undefined,
        raisedHandsQueue: [],
        remote: new Map(),
        remoteVideoSources: new Set<string>(),
        sortedRemoteParticipants: new Map(),
        sortedRemoteVirtualScreenshareParticipants: new Map()
    };
}

describe('Participants Reducer Unit Tests', () => {
    const reducer: (state: any, action: AnyAction) => any = ReducerRegistry._elements['features/base/participants'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('returns default initial state for unknown action', () => {
        const state = reducer(undefined, { type: 'UNKNOWN_ACTION' });

        expect(state).toBeDefined();
        expect(state.local).toBeUndefined();
        expect(state.remote).toBeInstanceOf(Map);
        expect(state.dominantSpeaker).toBeUndefined();
        expect(state.pinnedParticipant).toBeUndefined();
        expect(state.raisedHandsQueue).toEqual([]);
        expect(state.numberOfNonModeratorParticipants).toBe(0);
    });

    describe('PARTICIPANT_JOINED', () => {
        it('handles local participant joined and assigns default id if missing', () => {
            const state = reducer(getInitialState(), {
                participant: {
                    local: true,
                    name: 'Local User'
                },
                type: PARTICIPANT_JOINED
            });

            expect(state.local).toBeDefined();
            expect(state.local.name).toBe('Local User');
            expect(state.local.id).toBe(LOCAL_PARTICIPANT_DEFAULT_ID);
            expect(state.local.local).toBe(true);
        });

        it('handles remote participant joined and tracks non-moderator count', () => {
            const state = reducer(getInitialState(), {
                participant: {
                    id: 'remote-1',
                    local: false,
                    name: 'Remote User 1',
                    role: PARTICIPANT_ROLE.PARTICIPANT
                },
                type: PARTICIPANT_JOINED
            });

            expect(state.remote.size).toBe(1);
            expect(state.remote.get('remote-1')).toBeDefined();
            expect(state.remote.get('remote-1').name).toBe('Remote User 1');
            expect(state.numberOfNonModeratorParticipants).toBe(1);
        });

        it('does not increment non-moderator count when remote moderator joins', () => {
            const state = reducer(getInitialState(), {
                participant: {
                    id: 'mod-1',
                    local: false,
                    name: 'Moderator User',
                    role: PARTICIPANT_ROLE.MODERATOR
                },
                type: PARTICIPANT_JOINED
            });

            expect(state.remote.size).toBe(1);
            expect(state.numberOfNonModeratorParticipants).toBe(0);
        });

        it('tracks virtual screenshare participant joined in sortedRemoteVirtualScreenshareParticipants', () => {
            const state = reducer(getInitialState(), {
                participant: {
                    fakeParticipant: 'RemoteScreenShare',
                    id: 'user-1-screenshare',
                    isVirtualScreenshareParticipant: true,
                    local: false,
                    name: 'User 1\'s Screenshare'
                },
                type: PARTICIPANT_JOINED
            });

            expect(state.remote.size).toBe(1);
            expect(state.sortedRemoteVirtualScreenshareParticipants.has('user-1-screenshare')).toBe(true);
        });
    });

    describe('PARTICIPANT_LEFT', () => {
        it('removes remote participant and decrements non-moderator count', () => {
            const joinedState = reducer(getInitialState(), {
                participant: {
                    id: 'remote-1',
                    local: false,
                    name: 'Remote User 1',
                    role: PARTICIPANT_ROLE.PARTICIPANT
                },
                type: PARTICIPANT_JOINED
            });

            expect(joinedState.remote.size).toBe(1);
            expect(joinedState.numberOfNonModeratorParticipants).toBe(1);

            const leftState = reducer(joinedState, {
                participant: {
                    id: 'remote-1'
                },
                type: PARTICIPANT_LEFT
            });

            expect(leftState.remote.size).toBe(0);
            expect(leftState.numberOfNonModeratorParticipants).toBe(0);
        });

        it('clears dominantSpeaker and pinnedParticipant when affected participant leaves', () => {
            let state = reducer(getInitialState(), {
                participant: {
                    id: 'remote-1',
                    local: false,
                    name: 'Remote User 1'
                },
                type: PARTICIPANT_JOINED
            });

            state = reducer(state, {
                participant: { id: 'remote-1' },
                type: DOMINANT_SPEAKER_CHANGED
            });
            state = reducer(state, {
                participant: { id: 'remote-1' },
                type: PIN_PARTICIPANT
            });

            expect(state.dominantSpeaker).toBe('remote-1');
            expect(state.pinnedParticipant).toBe('remote-1');

            const stateAfterLeave = reducer(state, {
                participant: { id: 'remote-1' },
                type: PARTICIPANT_LEFT
            });

            expect(stateAfterLeave.dominantSpeaker).toBeUndefined();
            expect(stateAfterLeave.pinnedParticipant).toBeUndefined();
        });

        it('removes leaving participant from raisedHandsQueue', () => {
            let state = reducer(getInitialState(), {
                participant: { id: 'remote-1', local: false },
                type: PARTICIPANT_JOINED
            });

            state = reducer(state, {
                queue: [ { id: 'remote-1', raisedHandTimestamp: 1000 } ],
                type: RAISE_HAND_UPDATED
            });

            expect(state.raisedHandsQueue.length).toBe(1);

            const stateAfterLeave = reducer(state, {
                participant: { id: 'remote-1' },
                type: PARTICIPANT_LEFT
            });

            expect(stateAfterLeave.raisedHandsQueue.length).toBe(0);
        });
    });

    describe('PARTICIPANT_UPDATED', () => {
        it('updates participant mutable properties for remote participant', () => {
            const joinedState = reducer(getInitialState(), {
                participant: {
                    id: 'remote-1',
                    local: false,
                    name: 'Original Name'
                },
                type: PARTICIPANT_JOINED
            });

            const updatedState = reducer(joinedState, {
                participant: {
                    id: 'remote-1',
                    name: 'Updated Name',
                    role: PARTICIPANT_ROLE.MODERATOR
                },
                type: PARTICIPANT_UPDATED
            });

            const participant = updatedState.remote.get('remote-1');

            expect(participant.name).toBe('Updated Name');
            expect(participant.role).toBe(PARTICIPANT_ROLE.MODERATOR);
        });

        it('disregards immutable property changes during update', () => {
            const joinedState = reducer(getInitialState(), {
                participant: {
                    dominantSpeaker: false,
                    id: 'remote-1',
                    local: false,
                    name: 'Original Name'
                },
                type: PARTICIPANT_JOINED
            });

            const updatedState = reducer(joinedState, {
                participant: {
                    dominantSpeaker: true,
                    id: 'remote-1'
                },
                type: PARTICIPANT_UPDATED
            });

            const participant = updatedState.remote.get('remote-1');

            expect(participant.dominantSpeaker).toBe(false);
        });
    });

    describe('PARTICIPANT_ID_CHANGED', () => {
        it('updates local participant id on connection establishment', () => {
            const joinedState = reducer(getInitialState(), {
                participant: {
                    id: LOCAL_PARTICIPANT_DEFAULT_ID,
                    local: true,
                    name: 'Local User'
                },
                type: PARTICIPANT_JOINED
            });

            const updatedState = reducer(joinedState, {
                newValue: 'new-authenticated-id',
                oldValue: LOCAL_PARTICIPANT_DEFAULT_ID,
                type: PARTICIPANT_ID_CHANGED
            });

            expect(updatedState.local.id).toBe('new-authenticated-id');
        });
    });

    describe('DOMINANT_SPEAKER_CHANGED & PIN_PARTICIPANT', () => {
        it('updates dominant speaker and activeSpeakers history', () => {
            let state = reducer(getInitialState(), {
                participant: {
                    id: 'speaker-1',
                    local: false,
                    name: 'Speaker 1'
                },
                type: PARTICIPANT_JOINED
            });

            state = reducer(state, {
                participant: {
                    id: 'speaker-2',
                    local: false,
                    name: 'Speaker 2'
                },
                type: PARTICIPANT_JOINED
            });

            state = reducer(state, {
                participant: {
                    id: 'speaker-1',
                    previousSpeakers: [ 'speaker-2' ]
                },
                type: DOMINANT_SPEAKER_CHANGED
            });

            expect(state.dominantSpeaker).toBe('speaker-1');
            expect(state.activeSpeakers.has('speaker-2')).toBe(true);
        });

        it('pins participant and unpins when called with no participant id', () => {
            let state = reducer(getInitialState(), {
                participant: {
                    id: 'part-1',
                    local: false,
                    name: 'Participant 1'
                },
                type: PARTICIPANT_JOINED
            });

            state = reducer(state, {
                participant: { id: 'part-1' },
                type: PIN_PARTICIPANT
            });

            expect(state.pinnedParticipant).toBe('part-1');

            const unpinnedState = reducer(state, {
                participant: {},
                type: PIN_PARTICIPANT
            });

            expect(unpinnedState.pinnedParticipant).toBeUndefined();
        });
    });

    describe('RAISE_HAND_UPDATED & RAISE_HAND_CLEAR', () => {
        it('sets raisedHandsQueue on RAISE_HAND_UPDATED', () => {
            const raisedState = reducer(getInitialState(), {
                queue: [ { id: 'user-1', raisedHandTimestamp: 12345 } ],
                type: RAISE_HAND_UPDATED
            });

            expect(raisedState.raisedHandsQueue).toEqual([
                { id: 'user-1', raisedHandTimestamp: 12345 }
            ]);
        });

        it('clears all entries on RAISE_HAND_CLEAR', () => {
            const raisedState = reducer(getInitialState(), {
                queue: [ { id: 'user-1', raisedHandTimestamp: 12345 } ],
                type: RAISE_HAND_UPDATED
            });

            const clearedState = reducer(raisedState, {
                type: RAISE_HAND_CLEAR
            });

            expect(clearedState.raisedHandsQueue).toEqual([]);
        });
    });

    describe('OVERWRITE_PARTICIPANT_NAME & SCREENSHARE_PARTICIPANT_NAME_CHANGED', () => {
        it('records custom name override in overwrittenNameList', () => {
            const state = reducer(getInitialState(), {
                id: 'part-1',
                name: 'Overridden Name',
                type: OVERWRITE_PARTICIPANT_NAME
            });

            expect(state.overwrittenNameList['part-1']).toBe('Overridden Name');
        });

        it('updates screenshare participant name in sortedRemoteVirtualScreenshareParticipants', () => {
            const joinedState = reducer(getInitialState(), {
                participant: {
                    fakeParticipant: 'RemoteScreenShare',
                    id: 'part-1-screenshare',
                    isVirtualScreenshareParticipant: true,
                    local: false,
                    name: 'Old Screenshare Name'
                },
                type: PARTICIPANT_JOINED
            });

            const updatedState = reducer(joinedState, {
                id: 'part-1-screenshare',
                name: 'New Screenshare Name',
                type: SCREENSHARE_PARTICIPANT_NAME_CHANGED
            });

            expect(updatedState.sortedRemoteVirtualScreenshareParticipants.get('part-1-screenshare')).toBe('New Screenshare Name');
        });
    });
});

// @vitest-environment happy-dom

import { AnyAction } from 'redux';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./functions', () => ({
    isRoomValid: (room?: string) => typeof room === 'string' && room !== ''
}));

vi.mock('../lib-jitsi-meet', () => ({
    JitsiConferenceErrors: {
        AUTHENTICATION_REQUIRED: 'conference.authenticationRequired',
        CONFERENCE_ACCESS_DENIED: 'conference.accessDenied',
        DISPLAY_NAME_REQUIRED: 'conference.displayNameRequired',
        MEMBERS_ONLY_ERROR: 'conference.membersOnlyError',
        PASSWORD_REQUIRED: 'conference.passwordRequired'
    }
}));

import ReducerRegistry from '../redux/ReducerRegistry';

import {
    CONFERENCE_CONNECTION_ESTABLISHED,
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_LOCAL_SUBJECT_CHANGED,
    CONFERENCE_SUBJECT_CHANGED,
    CONFERENCE_TIMESTAMP_CHANGED,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE,
    DATA_CHANNEL_CLOSED,
    DATA_CHANNEL_OPENED,
    SET_ASSUMED_BANDWIDTH_BPS,
    SET_PASSWORD,
    SET_ROOM
} from './actionTypes';
import './reducer';

describe('Conference Reducer Unit Tests', () => {
    const reducer: (state: any, action: AnyAction) => any = ReducerRegistry._elements['features/base/conference'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('returns default state for unknown action', () => {
        const state = reducer(undefined, { type: 'UNKNOWN_ACTION' });

        expect(typeof state).toBe('object');
        expect(state.conference).toBeUndefined();
        expect(state.room).toBeUndefined();
    });

    it('sets room name on SET_ROOM', () => {
        const state = reducer(undefined, {
            room: 'my-awesome-test-room',
            type: SET_ROOM
        });

        expect(state.room).toBe('my-awesome-test-room');
    });

    it('marks ICE connection established on CONFERENCE_CONNECTION_ESTABLISHED', () => {
        const initialState = { iceConnected: false };
        const state = reducer(initialState as any, {
            type: CONFERENCE_CONNECTION_ESTABLISHED
        });

        expect(state.iceConnected).toBe(true);
    });

    it('updates subject and localSubject on respective actions', () => {
        const stateWithSubject = reducer(undefined, {
            subject: 'Sprint Planning Meeting',
            type: CONFERENCE_SUBJECT_CHANGED
        });

        expect(stateWithSubject.subject).toBe('Sprint Planning Meeting');

        const stateWithLocalSubject = reducer(stateWithSubject, {
            localSubject: 'Custom Local Topic',
            type: CONFERENCE_LOCAL_SUBJECT_CHANGED
        });

        expect(stateWithLocalSubject.localSubject).toBe('Custom Local Topic');
        expect(stateWithLocalSubject.subject).toBe('Sprint Planning Meeting');
    });

    it('sets conference timestamp on CONFERENCE_TIMESTAMP_CHANGED', () => {
        const timestamp = 1750001234;
        const state = reducer(undefined, {
            conferenceTimestamp: timestamp,
            type: CONFERENCE_TIMESTAMP_CHANGED
        });

        expect(state.conferenceTimestamp).toBe(timestamp);
    });

    it('tracks data channel opened and closed states', () => {
        const openState = reducer(undefined, {
            type: DATA_CHANNEL_OPENED
        });

        expect(openState.dataChannelOpen).toBe(true);

        const closedState = reducer(openState, {
            type: DATA_CHANNEL_CLOSED
        });

        expect(closedState.dataChannelOpen).toBe(false);
    });

    it('sets conference password on SET_PASSWORD with lock method', () => {
        const mockConference: any = {
            lock: () => undefined
        };
        const state = reducer(undefined, {
            conference: mockConference,
            method: mockConference.lock,
            password: 'secretPassword123',
            type: SET_PASSWORD
        });

        expect(state.password).toBe('secretPassword123');
        expect(state.locked).toBeTruthy();
    });

    it('sets conference password on SET_PASSWORD with join method', () => {
        const mockConference: any = {
            join: () => undefined
        };
        const state = reducer(undefined, {
            conference: mockConference,
            method: mockConference.join,
            password: 'joinPassword123',
            type: SET_PASSWORD
        });

        expect(state.password).toBe('joinPassword123');
        expect(state.joining).toBe(mockConference);
    });

    it('sets assumed bandwidth on SET_ASSUMED_BANDWIDTH_BPS', () => {
        const state = reducer(undefined, {
            assumedBandwidthBps: 2000000,
            type: SET_ASSUMED_BANDWIDTH_BPS
        });

        expect(state.assumedBandwidthBps).toBe(2000000);
    });

    it('handles CONFERENCE_WILL_JOIN and CONFERENCE_JOINED lifecycle', () => {
        const mockConference: any = {
            id: 'conf-123',
            isE2EESupported: () => false,
            room: { locked: false }
        };

        const joiningState = reducer(undefined, {
            conference: mockConference,
            type: CONFERENCE_WILL_JOIN
        });

        expect(joiningState.joining).toBe(mockConference);
        expect(joiningState.conference).toBeUndefined();

        const joinedState = reducer(joiningState, {
            conference: mockConference,
            type: CONFERENCE_JOINED
        });

        expect(joinedState.conference).toBe(mockConference);
        expect(joinedState.joining).toBeUndefined();
    });

    it('handles CONFERENCE_WILL_LEAVE and CONFERENCE_LEFT lifecycle', () => {
        const mockConference = { id: 'conf-123' };
        const initialState = {
            conference: mockConference,
            iceConnected: true,
            password: 'pass'
        };

        const leavingState = reducer(initialState as any, {
            conference: mockConference,
            type: CONFERENCE_WILL_LEAVE
        });

        expect(leavingState.leaving).toBe(mockConference);

        const leftState = reducer(leavingState, {
            conference: mockConference,
            type: CONFERENCE_LEFT
        });

        expect(leftState.conference).toBeUndefined();
        expect(leftState.leaving).toBeUndefined();
        expect(leftState.iceConnected).toBeUndefined();
        expect(leftState.password).toBeUndefined();
    });

    it('records error and clears joining state on CONFERENCE_FAILED', () => {
        const mockConference = { id: 'conf-123' };
        const mockError = new Error('Connection failed');
        const initialState = {
            conference: undefined,
            joining: mockConference
        };

        const failedState = reducer(initialState as any, {
            conference: mockConference,
            error: mockError,
            type: CONFERENCE_FAILED
        });

        expect(failedState.error).toBe(mockError);
        expect(failedState.joining).toBeUndefined();
    });
});

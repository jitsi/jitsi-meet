import { describe, it } from 'node:test';
import assert from 'node:assert';

import ReducerRegistry from '../../react/features/base/redux/ReducerRegistry';
import '../../react/features/base/conference/reducer';
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
} from '../../react/features/base/conference/actionTypes';

describe('Conference Reducer Unit Tests', () => {
    const reducer = ReducerRegistry._elements['features/base/conference'];

    it('is registered in ReducerRegistry', () => {
        assert.ok(reducer, 'Reducer should be registered under features/base/conference');
    });

    it('returns default state for unknown action', () => {
        const state = reducer(undefined, { type: 'UNKNOWN_ACTION' });

        assert.strictEqual(typeof state, 'object');
        assert.strictEqual(state.conference, undefined);
        assert.strictEqual(state.room, undefined);
    });

    it('sets room name on SET_ROOM', () => {
        const state = reducer(undefined, {
            type: SET_ROOM,
            room: 'my-awesome-test-room'
        });

        assert.strictEqual(state.room, 'my-awesome-test-room');
    });

    it('marks ICE connection established on CONFERENCE_CONNECTION_ESTABLISHED', () => {
        const initialState = { iceConnected: false };
        const state = reducer(initialState as any, {
            type: CONFERENCE_CONNECTION_ESTABLISHED
        });

        assert.strictEqual(state.iceConnected, true);
    });

    it('updates subject and localSubject on respective actions', () => {
        const stateWithSubject = reducer(undefined, {
            type: CONFERENCE_SUBJECT_CHANGED,
            subject: 'Sprint Planning Meeting'
        });
        assert.strictEqual(stateWithSubject.subject, 'Sprint Planning Meeting');

        const stateWithLocalSubject = reducer(stateWithSubject, {
            type: CONFERENCE_LOCAL_SUBJECT_CHANGED,
            localSubject: 'Custom Local Topic'
        });
        assert.strictEqual(stateWithLocalSubject.localSubject, 'Custom Local Topic');
        assert.strictEqual(stateWithLocalSubject.subject, 'Sprint Planning Meeting');
    });

    it('sets conference timestamp on CONFERENCE_TIMESTAMP_CHANGED', () => {
        const timestamp = 1750001234;
        const state = reducer(undefined, {
            type: CONFERENCE_TIMESTAMP_CHANGED,
            conferenceTimestamp: timestamp
        });

        assert.strictEqual(state.conferenceTimestamp, timestamp);
    });

    it('tracks data channel opened and closed states', () => {
        const openState = reducer(undefined, {
            type: DATA_CHANNEL_OPENED
        });
        assert.strictEqual(openState.dataChannelOpen, true);

        const closedState = reducer(openState, {
            type: DATA_CHANNEL_CLOSED
        });
        assert.strictEqual(closedState.dataChannelOpen, false);
    });

    it('sets conference password on SET_PASSWORD with lock method', () => {
        const mockConference: any = {
            lock: function() {}
        };
        const state = reducer(undefined, {
            type: SET_PASSWORD,
            conference: mockConference,
            method: mockConference.lock,
            password: 'secretPassword123'
        });

        assert.strictEqual(state.password, 'secretPassword123');
        assert.ok(state.locked);
    });

    it('sets conference password on SET_PASSWORD with join method', () => {
        const mockConference: any = {
            join: function() {}
        };
        const state = reducer(undefined, {
            type: SET_PASSWORD,
            conference: mockConference,
            method: mockConference.join,
            password: 'joinPassword123'
        });

        assert.strictEqual(state.password, 'joinPassword123');
        assert.strictEqual(state.joining, mockConference);
    });

    it('sets assumed bandwidth on SET_ASSUMED_BANDWIDTH_BPS', () => {
        const state = reducer(undefined, {
            type: SET_ASSUMED_BANDWIDTH_BPS,
            assumedBandwidthBps: 2000000
        });

        assert.strictEqual(state.assumedBandwidthBps, 2000000);
    });

    it('handles CONFERENCE_WILL_JOIN and CONFERENCE_JOINED lifecycle', () => {
        const mockConference: any = {
            id: 'conf-123',
            isE2EESupported: () => false,
            room: { locked: false }
        };

        const joiningState = reducer(undefined, {
            type: CONFERENCE_WILL_JOIN,
            conference: mockConference
        });
        assert.strictEqual(joiningState.joining, mockConference);
        assert.strictEqual(joiningState.conference, undefined);

        const joinedState = reducer(joiningState, {
            type: CONFERENCE_JOINED,
            conference: mockConference
        });
        assert.strictEqual(joinedState.conference, mockConference);
        assert.strictEqual(joinedState.joining, undefined);
    });

    it('handles CONFERENCE_WILL_LEAVE and CONFERENCE_LEFT lifecycle', () => {
        const mockConference = { id: 'conf-123' };
        const initialState = {
            conference: mockConference,
            iceConnected: true,
            password: 'pass'
        };

        const leavingState = reducer(initialState as any, {
            type: CONFERENCE_WILL_LEAVE,
            conference: mockConference
        });
        assert.strictEqual(leavingState.leaving, mockConference);

        const leftState = reducer(leavingState, {
            type: CONFERENCE_LEFT,
            conference: mockConference
        });
        assert.strictEqual(leftState.conference, undefined);
        assert.strictEqual(leftState.leaving, undefined);
        assert.strictEqual(leftState.iceConnected, undefined);
        assert.strictEqual(leftState.password, undefined);
    });

    it('records error and clears joining state on CONFERENCE_FAILED', () => {
        const mockConference = { id: 'conf-123' };
        const mockError = new Error('Connection failed');
        const initialState = {
            joining: mockConference,
            conference: undefined
        };

        const failedState = reducer(initialState as any, {
            type: CONFERENCE_FAILED,
            conference: mockConference,
            error: mockError
        });

        assert.strictEqual(failedState.error, mockError);
        assert.strictEqual(failedState.joining, undefined);
    });
});

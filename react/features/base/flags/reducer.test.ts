import { Reducer } from 'redux';
import { describe, expect, it } from 'vitest';

import ReducerRegistry from '../redux/ReducerRegistry';

import { UPDATE_FLAGS } from './actionTypes';
import { DEFAULT_STATE, IFlagsState } from './reducer';

describe('Flags Reducer Unit Tests', () => {
    const reducer: Reducer<IFlagsState> = ReducerRegistry._elements['features/base/flags'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('returns default state for unknown action', () => {
        const initialState: IFlagsState | undefined = undefined;
        const state = reducer(initialState, { type: 'UNKNOWN_ACTION' });

        expect(state).toEqual(DEFAULT_STATE);
    });

    it('updates feature flags when UPDATE_FLAGS is dispatched', () => {
        const initialState: IFlagsState = {};
        const action = {
            flags: {
                'chat.enabled': true,
                'pip.enabled': false
            },
            type: UPDATE_FLAGS
        };

        const nextState = reducer(initialState, action);

        expect(nextState).toEqual({
            'chat.enabled': true,
            'pip.enabled': false
        });
    });

    it('merges new flags with existing flags preserving unaffected keys', () => {
        const initialState: IFlagsState = {
            'chat.enabled': true,
            'meeting-name.enabled': true
        };
        const action = {
            flags: {
                'chat.enabled': false,
                'recording.enabled': true
            },
            type: UPDATE_FLAGS
        };

        const nextState = reducer(initialState, action);

        expect(nextState).toEqual({
            'chat.enabled': false,
            'meeting-name.enabled': true,
            'recording.enabled': true
        });
    });

    it('preserves state reference equality when new flags match existing flags', () => {
        const initialState: IFlagsState = {
            'chat.enabled': true
        };
        const action = {
            flags: {
                'chat.enabled': true
            },
            type: UPDATE_FLAGS
        };

        const nextState = reducer(initialState, action);

        expect(nextState).toBe(initialState);
    });
});

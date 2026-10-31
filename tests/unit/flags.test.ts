import { describe, expect, it } from 'vitest';

import { UPDATE_FLAGS } from '../../react/features/base/flags/actionTypes';
import '../../react/features/base/flags/reducer';
import ReducerRegistry from '../../react/features/base/redux/ReducerRegistry';

describe('Flags Reducer Unit Tests', () => {
    const reducer = ReducerRegistry._elements['features/base/flags'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('returns default state for unknown action', () => {
        const initialState = undefined;
        const state = reducer(initialState, { type: 'UNKNOWN_ACTION' });

        expect(state).toEqual({});
    });

    it('updates feature flags when UPDATE_FLAGS is dispatched', () => {
        const initialState = {};
        const action = {
            type: UPDATE_FLAGS,
            flags: {
                'chat.enabled': true,
                'pip.enabled': false
            }
        };

        const nextState = reducer(initialState, action);

        expect(nextState).toEqual({
            'chat.enabled': true,
            'pip.enabled': false
        });
    });

    it('merges new flags with existing flags preserving unaffected keys', () => {
        const initialState = {
            'chat.enabled': true,
            'meeting-name.enabled': true
        };
        const action = {
            type: UPDATE_FLAGS,
            flags: {
                'chat.enabled': false,
                'recording.enabled': true
            }
        };

        const nextState = reducer(initialState, action);

        expect(nextState).toEqual({
            'chat.enabled': false,
            'meeting-name.enabled': true,
            'recording.enabled': true
        });
    });

    it('preserves state reference equality when new flags match existing flags', () => {
        const initialState = {
            'chat.enabled': true,
            'call-integration.enabled': false
        };
        const action = {
            type: UPDATE_FLAGS,
            flags: {
                'chat.enabled': true,
                'call-integration.enabled': false
            }
        };

        const nextState = reducer(initialState, action);

        expect(nextState).toBe(initialState);
    });
});

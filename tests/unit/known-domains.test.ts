import { describe, expect, it } from 'vitest';

import { ADD_KNOWN_DOMAINS } from '../../react/features/base/known-domains/actionTypes';
import { DEFAULT_STATE } from '../../react/features/base/known-domains/reducer';
import ReducerRegistry from '../../react/features/base/redux/ReducerRegistry';

describe('KnownDomains Reducer Unit Tests', () => {
    const reducer = ReducerRegistry._elements['features/base/known-domains'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('returns default state for unknown action', () => {
        const initialState = undefined;
        const action = { type: 'UNKNOWN_ACTION' };
        const state = reducer(initialState, action);

        expect(state).toEqual(DEFAULT_STATE);
    });

    it('adds new known domains and normalizes to lowercase', () => {
        const initialState = [ 'meet.jit.si' ];
        const action = {
            type: ADD_KNOWN_DOMAINS,
            knownDomains: [ 'CUSTOM.DOMAIN.COM', 'another.domain.org' ]
        };
        const state = reducer(initialState, action);

        expect(state).toEqual([
            'meet.jit.si',
            'custom.domain.com',
            'another.domain.org'
        ]);
    });

    it('avoids adding duplicate domains', () => {
        const initialState = [ 'meet.jit.si', '8x8.vc' ];
        const action = {
            type: ADD_KNOWN_DOMAINS,
            knownDomains: [ 'MEET.JIT.SI', 'new.domain.com' ]
        };
        const state = reducer(initialState, action);

        expect(state).toEqual([
            'meet.jit.si',
            '8x8.vc',
            'new.domain.com'
        ]);
    });
});

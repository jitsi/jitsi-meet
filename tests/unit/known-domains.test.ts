import { describe, it } from 'node:test';
import assert from 'node:assert';

import ReducerRegistry from '../../react/features/base/redux/ReducerRegistry';
import '../../react/features/base/known-domains/reducer';
import { ADD_KNOWN_DOMAINS } from '../../react/features/base/known-domains/actionTypes';
import { DEFAULT_STATE } from '../../react/features/base/known-domains/reducer';

describe('KnownDomains Reducer Unit Tests', () => {
    const reducer = ReducerRegistry._elements['features/base/known-domains'];

    it('is registered in ReducerRegistry', () => {
        assert.ok(reducer, 'Reducer should be registered in ReducerRegistry');
    });

    it('returns default state for unknown action', () => {
        const initialState = undefined;
        const action = { type: 'UNKNOWN_ACTION' };
        const state = reducer(initialState, action);

        assert.deepStrictEqual(state, DEFAULT_STATE);
    });

    it('adds new known domains and normalizes to lowercase', () => {
        const initialState = [ 'meet.jit.si' ];
        const action = {
            type: ADD_KNOWN_DOMAINS,
            knownDomains: [ 'CUSTOM.DOMAIN.COM', 'another.domain.org' ]
        };
        const state = reducer(initialState, action);

        assert.deepStrictEqual(state, [
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

        assert.deepStrictEqual(state, [
            'meet.jit.si',
            '8x8.vc',
            'new.domain.com'
        ]);
    });
});

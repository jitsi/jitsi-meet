// @vitest-environment happy-dom

import { Reducer } from 'redux';
import { describe, expect, it } from 'vitest';

import ReducerRegistry from '../redux/ReducerRegistry';

import { ADD_KNOWN_DOMAINS } from './actionTypes';
import { DEFAULT_STATE, IKnownDomainsState } from './reducer';

describe('KnownDomains Reducer Unit Tests', () => {
    const reducer: Reducer<IKnownDomainsState> = ReducerRegistry._elements['features/base/known-domains'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('returns default state for unknown action', () => {
        const initialState: IKnownDomainsState | undefined = undefined;
        const action = { type: 'UNKNOWN_ACTION' };
        const state = reducer(initialState, action);

        expect(state).toEqual(DEFAULT_STATE);
    });

    it('adds new known domains and normalizes to lowercase', () => {
        const initialState: IKnownDomainsState = [ 'meet.jit.si' ];
        const action = {
            knownDomains: [ 'CUSTOM.DOMAIN.COM', 'another.domain.org' ],
            type: ADD_KNOWN_DOMAINS
        };
        const state = reducer(initialState, action);

        expect(state).toEqual([
            'meet.jit.si',
            'custom.domain.com',
            'another.domain.org'
        ]);
    });

    it('avoids adding duplicate domains', () => {
        const initialState: IKnownDomainsState = [ 'meet.jit.si', '8x8.vc' ];
        const action = {
            knownDomains: [ 'MEET.JIT.SI', 'new.domain.com' ],
            type: ADD_KNOWN_DOMAINS
        };
        const state = reducer(initialState, action);

        expect(state).toEqual([
            'meet.jit.si',
            '8x8.vc',
            'new.domain.com'
        ]);
    });

    it('handles non-array persisted state gracefully', () => {
        // In case persistence has deserialized a null state
        // @ts-expect-error testing non-array persisted state
        const stateWithNull = reducer(null, {
            knownDomains: [ 'example.com' ],
            type: ADD_KNOWN_DOMAINS
        });

        expect(stateWithNull).toEqual([ 'example.com' ]);

        // In case persistence has deserialized an unexpected string state
        // @ts-expect-error testing non-array persisted state
        const stateWithString = reducer('abc', {
            knownDomains: [ 'example.com' ],
            type: ADD_KNOWN_DOMAINS
        });

        expect(stateWithString).toEqual([ 'example.com' ]);
    });
});

import { describe, it } from 'node:test';
import assert from 'node:assert';

import ReducerRegistry from '../../react/features/base/redux/ReducerRegistry';
import '../../react/features/base/jwt/reducer';
import {
    SET_DELAYED_LOAD_OF_AVATAR_URL,
    SET_JWT,
    SET_KNOWN_AVATAR_URL
} from '../../react/features/base/jwt/actionTypes';

describe('JWT Reducer Unit Tests', () => {
    const reducer = ReducerRegistry._elements['features/base/jwt'];

    it('is registered in ReducerRegistry', () => {
        assert.ok(reducer, 'Reducer should be registered in ReducerRegistry');
    });

    it('returns empty object as default state for unknown action', () => {
        const initialState = undefined;
        const state = reducer(initialState, { type: 'UNKNOWN_ACTION' });

        assert.deepStrictEqual(state, {});
    });

    it('stores jwt payload on SET_JWT', () => {
        const initialState = {};
        const action = {
            type: SET_JWT,
            jwt: 'mock.header.payload',
            tenant: 'my-tenant',
            user: {
                id: 'user-123',
                name: 'Alice'
            }
        };

        const nextState = reducer(initialState, action);
        assert.strictEqual(nextState.jwt, 'mock.header.payload');
        assert.strictEqual(nextState.tenant, 'my-tenant');
        assert.deepStrictEqual(nextState.user, { id: 'user-123', name: 'Alice' });
    });

    it('preserves reference when SET_JWT payload is identical', () => {
        const initialState = {
            jwt: 'token123',
            tenant: 'tenant1'
        };
        const action = {
            type: SET_JWT,
            jwt: 'token123',
            tenant: 'tenant1'
        };

        const nextState = reducer(initialState, action);
        assert.strictEqual(nextState, initialState, 'Should return original state reference if equal');
    });

    it('sets delayed avatar URL on SET_DELAYED_LOAD_OF_AVATAR_URL', () => {
        const initialState = { jwt: 'token123' };
        const action = {
            type: SET_DELAYED_LOAD_OF_AVATAR_URL,
            avatarUrl: 'https://example.com/avatar.png'
        };

        const nextState = reducer(initialState, action);
        assert.strictEqual(nextState.delayedLoadOfAvatarUrl, 'https://example.com/avatar.png');
        assert.strictEqual(nextState.jwt, 'token123');
    });

    it('sets known avatar URL on SET_KNOWN_AVATAR_URL', () => {
        const initialState = { jwt: 'token123' };
        const action = {
            type: SET_KNOWN_AVATAR_URL,
            avatarUrl: 'https://example.com/known.png'
        };

        const nextState = reducer(initialState, action);
        assert.strictEqual(nextState.knownAvatarUrl, 'https://example.com/known.png');
    });
});

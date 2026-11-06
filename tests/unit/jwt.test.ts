import { describe, expect, it } from 'vitest';

import {
    SET_DELAYED_LOAD_OF_AVATAR_URL,
    SET_JWT,
    SET_KNOWN_AVATAR_URL
} from '../../react/features/base/jwt/actionTypes';
import '../../react/features/base/jwt/reducer';
import ReducerRegistry from '../../react/features/base/redux/ReducerRegistry';

describe('JWT Reducer Unit Tests', () => {
    const reducer = ReducerRegistry._elements['features/base/jwt'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('returns empty object as default state for unknown action', () => {
        const initialState = undefined;
        const state = reducer(initialState, { type: 'UNKNOWN_ACTION' });

        expect(state).toEqual({});
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

        expect(nextState.jwt).toBe('mock.header.payload');
        expect(nextState.tenant).toBe('my-tenant');
        expect(nextState.user).toEqual({ id: 'user-123', name: 'Alice' });
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

        expect(nextState).toBe(initialState);
    });

    it('sets delayed avatar URL on SET_DELAYED_LOAD_OF_AVATAR_URL', () => {
        const initialState = { jwt: 'token123' };
        const action = {
            type: SET_DELAYED_LOAD_OF_AVATAR_URL,
            avatarUrl: 'https://example.com/avatar.png'
        };

        const nextState = reducer(initialState, action);

        expect(nextState.delayedLoadOfAvatarUrl).toBe('https://example.com/avatar.png');
        expect(nextState.jwt).toBe('token123');
    });

    it('sets known avatar URL on SET_KNOWN_AVATAR_URL', () => {
        const initialState = { jwt: 'token123' };
        const action = {
            type: SET_KNOWN_AVATAR_URL,
            avatarUrl: 'https://example.com/known.png'
        };

        const nextState = reducer(initialState, action);

        expect(nextState.knownAvatarUrl).toBe('https://example.com/known.png');
    });
});

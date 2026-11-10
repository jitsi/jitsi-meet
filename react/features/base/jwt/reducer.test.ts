// @vitest-environment happy-dom

import { Reducer } from 'redux';
import { describe, expect, it } from 'vitest';

import ReducerRegistry from '../redux/ReducerRegistry';

import {
    SET_DELAYED_LOAD_OF_AVATAR_URL,
    SET_JWT,
    SET_KNOWN_AVATAR_URL
} from './actionTypes';
import { DEFAULT_STATE, IJwtState } from './reducer';

describe('JWT Reducer Unit Tests', () => {
    const reducer: Reducer<IJwtState> = ReducerRegistry._elements['features/base/jwt'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('returns empty object as default state for unknown action', () => {
        const initialState: IJwtState | undefined = undefined;
        const state = reducer(initialState, { type: 'UNKNOWN_ACTION' });

        expect(state).toEqual(DEFAULT_STATE);
    });

    it('stores jwt payload on SET_JWT', () => {
        const initialState: IJwtState = {};
        const action = {
            jwt: 'mock.header.payload',
            type: SET_JWT
        };

        const nextState = reducer(initialState, action);

        expect(nextState.jwt).toBe('mock.header.payload');
    });

    it('preserves reference when SET_JWT payload is identical', () => {
        const initialState: IJwtState = {
            jwt: 'same.jwt.token'
        };
        const action = {
            jwt: 'same.jwt.token',
            type: SET_JWT
        };

        const nextState = reducer(initialState, action);

        expect(nextState).toBe(initialState);
    });

    it('sets delayed avatar URL on SET_DELAYED_LOAD_OF_AVATAR_URL', () => {
        const initialState: IJwtState = {};
        const action = {
            avatarUrl: 'https://example.com/avatar.png',
            type: SET_DELAYED_LOAD_OF_AVATAR_URL
        };

        const nextState = reducer(initialState, action);

        expect(nextState.delayedLoadOfAvatarUrl).toBe('https://example.com/avatar.png');
    });

    it('sets known avatar URL on SET_KNOWN_AVATAR_URL', () => {
        const initialState: IJwtState = {};
        const action = {
            avatarUrl: 'https://example.com/known.png',
            type: SET_KNOWN_AVATAR_URL
        };

        const nextState = reducer(initialState, action);

        expect(nextState.knownAvatarUrl).toBe('https://example.com/known.png');
    });
});

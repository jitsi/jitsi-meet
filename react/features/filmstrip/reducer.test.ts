import { Reducer } from 'redux';
import { describe, expect, it } from 'vitest';

import { IReduxState } from '../app/types';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_REMOTE_PARTICIPANTS } from './actionTypes';
import './reducer';

type IFilmstripState = IReduxState['features/filmstrip'];

describe('Filmstrip Reducer Unit Tests', () => {
    const reducer: Reducer<IFilmstripState> = ReducerRegistry._elements['features/filmstrip'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    describe('SET_REMOTE_PARTICIPANTS', () => {
        const createState = (): IFilmstripState => Object.freeze({
            ...reducer(undefined, { type: 'UNKNOWN_ACTION' }),
            visibleParticipantsEndIndex: 2,
            visibleParticipantsStartIndex: 1
        });
        const action = {
            participants: [ 'a', 'b', 'c', 'd' ],
            type: SET_REMOTE_PARTICIPANTS
        };

        it('stores the remote participants and the visible ones', () => {
            const nextState = reducer(createState(), action);

            expect(nextState.remoteParticipants).toEqual([ 'a', 'b', 'c', 'd' ]);
            expect([ ...nextState.visibleRemoteParticipants ]).toEqual([ 'b', 'c' ]);
        });

        it('leaves the previous state untouched', () => {
            const state = createState();
            const nextState = reducer(state, action);

            expect(nextState).not.toBe(state);
            expect(state.remoteParticipants).toEqual([]);
            expect(state.visibleRemoteParticipants.size).toBe(0);
        });
    });
});

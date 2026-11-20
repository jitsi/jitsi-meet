import { Reducer } from 'redux';
import { describe, expect, it } from 'vitest';

import { IReduxState } from '../app/types';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import { PARTICIPANTS_PANE_CLOSE, PARTICIPANTS_PANE_OPEN, SET_VOLUME } from './actionTypes';
import { REDUCER_KEY } from './constants';
import './reducer';

type IParticipantsPaneState = IReduxState['features/participants-pane'];

describe('Participants Pane Reducer Unit Tests', () => {
    const reducer: Reducer<IParticipantsPaneState> = ReducerRegistry._elements[REDUCER_KEY];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('is closed by default', () => {
        expect(reducer(undefined, { type: 'UNKNOWN_ACTION' })).toEqual({ isOpen: false });
    });

    it('opens and closes', () => {
        const openState = reducer({ isOpen: false }, { type: PARTICIPANTS_PANE_OPEN });

        expect(openState.isOpen).toBe(true);
        expect(reducer(openState, { type: PARTICIPANTS_PANE_CLOSE }).isOpen).toBe(false);
    });

    it('does not keep the volume of the participants', () => {
        const state = { isOpen: false };

        expect(reducer(state, {
            participantId: 'p1',
            type: SET_VOLUME,
            volume: 0.5
        })).toBe(state);
    });
});

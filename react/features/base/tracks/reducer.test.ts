import { Reducer } from 'redux';
import { describe, expect, it } from 'vitest';

import { IReduxState } from '../../app/types';
import { PARTICIPANT_ID_CHANGED } from '../participants/actionTypes';
import ReducerRegistry from '../redux/ReducerRegistry';

import { TRACK_NO_DATA_FROM_SOURCE, TRACK_UPDATED } from './actionTypes';
import './reducer';
import { ITrack } from './types';

type ITracksState = IReduxState['features/base/tracks'];

describe('Tracks Reducer Unit Tests', () => {
    const reducer: Reducer<ITracksState> = ReducerRegistry._elements['features/base/tracks'];
    const jitsiTrack = { isReceivingData: () => true };
    const createState = (): ITracksState => [
        {
            isReceivingData: true,
            jitsiTrack,
            muted: false,
            participantId: 'p1'
        } as ITrack,
        {
            isReceivingData: true,
            jitsiTrack: { isReceivingData: () => true },
            muted: false,
            participantId: 'p2'
        } as ITrack
    ];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    describe('TRACK_UPDATED', () => {
        it('returns the same tracks when nothing changed', () => {
            const state = createState();

            expect(reducer(state, {
                track: {
                    jitsiTrack,
                    muted: false
                },
                type: TRACK_UPDATED
            })).toBe(state);
        });

        it('changes only the updated track', () => {
            const state = createState();
            const nextState = reducer(state, {
                track: {
                    jitsiTrack,
                    muted: true
                },
                type: TRACK_UPDATED
            });

            expect(nextState).not.toBe(state);
            expect(nextState[0].muted).toBe(true);
            expect(nextState[1]).toBe(state[1]);
            expect(state[0].muted).toBe(false);
        });
    });

    describe('TRACK_NO_DATA_FROM_SOURCE', () => {
        it('returns the same tracks when the receiving state did not change', () => {
            const state = createState();

            expect(reducer(state, {
                track: { jitsiTrack },
                type: TRACK_NO_DATA_FROM_SOURCE
            })).toBe(state);
        });

        it('changes only the track whose receiving state changed', () => {
            const state = createState();
            const silentTrack = { isReceivingData: () => false };

            state[0].jitsiTrack = silentTrack;

            const nextState = reducer(state, {
                track: { jitsiTrack: silentTrack },
                type: TRACK_NO_DATA_FROM_SOURCE
            });

            expect(nextState).not.toBe(state);
            expect(nextState[0].isReceivingData).toBe(false);
            expect(nextState[1]).toBe(state[1]);
        });
    });

    describe('PARTICIPANT_ID_CHANGED', () => {
        it('returns the same tracks when no track belongs to the old id', () => {
            const state = createState();

            expect(reducer(state, {
                newValue: 'p4',
                oldValue: 'p3',
                type: PARTICIPANT_ID_CHANGED
            })).toBe(state);
        });

        it('changes only the tracks of the old id', () => {
            const state = createState();
            const nextState = reducer(state, {
                newValue: 'p3',
                oldValue: 'p1',
                type: PARTICIPANT_ID_CHANGED
            });

            expect(nextState).not.toBe(state);
            expect(nextState[0].participantId).toBe('p3');
            expect(nextState[1]).toBe(state[1]);
        });
    });
});

import { Reducer } from 'redux';
import { describe, expect, it } from 'vitest';

import { IReduxState } from '../app/types';
import { PARTICIPANT_LEFT, PARTICIPANT_UPDATED } from '../base/participants/actionTypes';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import './reducer';

type IAVModerationState = IReduxState['features/av-moderation'];
type PendingList = IAVModerationState['pendingAudio'];

const pendingList = (...ids: string[]) => Object.freeze(ids.map(id => Object.freeze({ id }))) as PendingList;

const createState = (changes: Partial<IAVModerationState> = {}): IAVModerationState => Object.freeze({
    audioModerationEnabled: true,
    audioWhitelist: {},
    desktopModerationEnabled: true,
    desktopWhitelist: {},
    pendingAudio: pendingList('p1', 'p2'),
    pendingDesktop: pendingList('p1', 'p2'),
    pendingVideo: pendingList('p1', 'p2'),
    videoModerationEnabled: true,
    videoWhitelist: {},
    ...changes
});

describe('AV Moderation Reducer Unit Tests', () => {
    const reducer: Reducer<IAVModerationState> = ReducerRegistry._elements['features/av-moderation'];

    it('is registered in ReducerRegistry', () => {
        expect(reducer).toBeDefined();
    });

    it('returns the same state for unknown action', () => {
        const state = createState();

        expect(reducer(state, { type: 'UNKNOWN_ACTION' })).toBe(state);
    });

    describe('PARTICIPANT_UPDATED', () => {
        it('updates the participant in the pending lists of every moderated media type', () => {
            const state = createState();
            const nextState = reducer(state, {
                participant: {
                    id: 'p1',
                    name: 'Alice'
                },
                type: PARTICIPANT_UPDATED
            });

            expect(nextState.pendingAudio[0]).toEqual({
                id: 'p1',
                name: 'Alice'
            });
            expect(nextState.pendingDesktop[0]).toEqual({
                id: 'p1',
                name: 'Alice'
            });
            expect(nextState.pendingVideo[0]).toEqual({
                id: 'p1',
                name: 'Alice'
            });
        });

        it('leaves the previous state untouched', () => {
            const state = createState();
            const nextState = reducer(state, {
                participant: {
                    id: 'p1',
                    name: 'Alice'
                },
                type: PARTICIPANT_UPDATED
            });

            expect(nextState).not.toBe(state);
            expect(state.pendingAudio[0]).toEqual({ id: 'p1' });
            expect(state.pendingDesktop[0]).toEqual({ id: 'p1' });
            expect(state.pendingVideo[0]).toEqual({ id: 'p1' });
        });

        it('returns the same state when the participant is not pending', () => {
            const state = createState();

            expect(reducer(state, {
                participant: {
                    id: 'other',
                    name: 'Bob'
                },
                type: PARTICIPANT_UPDATED
            })).toBe(state);
        });
    });

    describe('PARTICIPANT_LEFT', () => {
        it('removes the participant from the pending lists of every moderated media type', () => {
            const nextState = reducer(createState(), {
                participant: { id: 'p1' },
                type: PARTICIPANT_LEFT
            });

            expect(nextState.pendingAudio).toEqual([ { id: 'p2' } ]);
            expect(nextState.pendingDesktop).toEqual([ { id: 'p2' } ]);
            expect(nextState.pendingVideo).toEqual([ { id: 'p2' } ]);
        });

        it('leaves the previous state untouched', () => {
            const state = createState();
            const nextState = reducer(state, {
                participant: { id: 'p1' },
                type: PARTICIPANT_LEFT
            });

            expect(nextState).not.toBe(state);
            expect(state.pendingAudio).toEqual([ { id: 'p1' }, { id: 'p2' } ]);
            expect(state.pendingDesktop).toEqual([ { id: 'p1' }, { id: 'p2' } ]);
            expect(state.pendingVideo).toEqual([ { id: 'p1' }, { id: 'p2' } ]);
        });

        it('returns the same state when the participant is not pending', () => {
            const state = createState();

            expect(reducer(state, {
                participant: { id: 'other' },
                type: PARTICIPANT_LEFT
            })).toBe(state);
        });
    });
});

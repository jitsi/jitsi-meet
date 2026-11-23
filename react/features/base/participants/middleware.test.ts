import { AnyAction, createStore } from 'redux';
import { describe, expect, it, vi } from 'vitest';

import { UPDATE_BREAKOUT_ROOMS } from '../../breakout-rooms/actionTypes';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { OVERWRITE_PARTICIPANT_NAME } from './actionTypes';
import './middleware';

const { rooms } = vi.hoisted(() => {
    return {
        rooms: {
            main: {
                id: 'main',
                participants: {
                    'main@conference.example.com/local': { displayName: 'Me' }
                }
            },
            room1: {
                id: 'room1',
                participants: {
                    'room1@breakout.example.com/abcd': { displayName: 'Old name' }
                }
            }
        }
    };
});

vi.mock('../../av-moderation/actions', () => ({}));
vi.mock('../../av-moderation/constants', () => ({}));
vi.mock('../../av-moderation/functions', () => ({}));
vi.mock('../../breakout-rooms/functions', () => ({ getBreakoutRooms: () => rooms }));
vi.mock('../../e2ee/actions', () => ({}));
vi.mock('../../e2ee/constants', () => ({}));
vi.mock('../../notifications/actions', () => ({}));
vi.mock('../../notifications/constants', () => ({}));
vi.mock('../../participants-pane/actions', () => ({}));
vi.mock('../../presence-status/constants', () => ({}));
vi.mock('../../reactions/constants', () => ({}));
vi.mock('../../recording/constants', () => ({}));
vi.mock('../../visitors/functions', () => ({}));
vi.mock('../conference/functions', () => ({}));
vi.mock('../config/functions.any', () => ({}));
vi.mock('../lib-jitsi-meet', () => ({ JitsiConferenceEvents: {} }));
vi.mock('../sounds/actions', () => ({}));
vi.mock('../util/uri', () => ({}));
vi.mock('./constants', () => ({}));
vi.mock('./functions', () => ({}));
vi.mock('./logger', () => ({ default: {} }));
vi.mock('./sounds', () => ({}));
vi.mock('./subscriber', () => ({}));

vi.mock('./actions', () => {
    return {
        participantUpdated: (participant: object) => ({
            participant,
            type: 'PARTICIPANT_UPDATED_TEST'
        })
    };
});

const overwriteName = (id: string, name: string) => {
    const actions: AnyAction[] = [];
    const store = createStore((state = { 'features/breakout-rooms': { roomCounter: 1 } }, action) => {
        actions.push(action);

        return state;
    }, MiddlewareRegistry.applyMiddleware());

    store.dispatch({
        id,
        name,
        type: OVERWRITE_PARTICIPANT_NAME
    });

    return actions;
};

describe('participants middleware', () => {
    describe('OVERWRITE_PARTICIPANT_NAME', () => {
        it('renames a participant who is in a breakout room', () => {
            const update = overwriteName('room1@breakout.example.com/abcd', 'Alice')
                .find(action => action.type === UPDATE_BREAKOUT_ROOMS);

            expect(update?.rooms.room1.participants['room1@breakout.example.com/abcd'].displayName).toBe('Alice');
            expect(update?.rooms.main).toBe(rooms.main);
            expect(update?.updatedNames).toBe(true);
        });

        it('leaves the stored rooms untouched', () => {
            overwriteName('room1@breakout.example.com/abcd', 'Alice');

            expect(rooms.room1.participants['room1@breakout.example.com/abcd'].displayName).toBe('Old name');
        });

        it('renames a participant of the current room through a participant update', () => {
            const actions = overwriteName('abcd', 'Alice');

            expect(actions.find(action => action.type === 'PARTICIPANT_UPDATED_TEST')?.participant).toEqual({
                id: 'abcd',
                name: 'Alice'
            });
            expect(actions.map(action => action.type)).not.toContain(UPDATE_BREAKOUT_ROOMS);
        });
    });
});

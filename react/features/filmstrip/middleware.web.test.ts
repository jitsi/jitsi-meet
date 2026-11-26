import { AnyAction, Store, createStore } from 'redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import {
    ADD_STAGE_PARTICIPANT,
    CLEAR_STAGE_PARTICIPANTS,
    REMOVE_STAGE_PARTICIPANT,
    SET_STAGE_PARTICIPANTS,
    TOGGLE_PIN_STAGE_PARTICIPANT
} from './actionTypes';
import { ACTIVE_PARTICIPANT_TIMEOUT } from './constants';

import './middleware.web';

interface IStageParticipant {
    participantId: string;
    pinned: boolean;
}

interface IState {
    dominant?: string;
    'features/base/settings': { maxStageParticipants: number; };
    'features/filmstrip': { activeParticipants: IStageParticipant[]; };
}

// Keep the import graph away from the large video, the layout and the participants, which need a running app.
vi.mock('../../../modules/UI/videolayout/VideoLayout', () => ({ default: {} }));
vi.mock('../base/participants/functions', () => {
    return {
        getDominantSpeakerParticipant: (state: IState) => state.dominant ? { id: state.dominant } : undefined,
        getLocalParticipant: () => ({ id: 'local' }),
        getLocalScreenShareParticipant: () => undefined,
        isScreenShareParticipant: () => false
    };
});
vi.mock('../video-layout/actions.web', () => ({ setTileView: vi.fn() }));
vi.mock('../video-layout/constants', () => ({ LAYOUTS: { TILE_VIEW: 'tile-view' } }));
vi.mock('../video-layout/functions.web', () => ({ getCurrentLayout: () => 'stage-filmstrip-view' }));
vi.mock('../whiteboard/constants', () => ({ WHITEBOARD_ID: 'whiteboard' }));
vi.mock('../whiteboard/functions', () => ({ isWhiteboardVisible: () => false }));
vi.mock('./actions.web', () => {
    return {
        addStageParticipant: (participantId: string, pinned = false) => {
            return { participantId, pinned, type: 'ADD_STAGE_PARTICIPANT' };
        },
        removeStageParticipant: (participantId: string) => ({ participantId, type: 'REMOVE_STAGE_PARTICIPANT' }),
        setFilmstripHeight: vi.fn(),
        setFilmstripWidth: vi.fn(),
        setScreenshareFilmstripParticipant: vi.fn(),
        setStageParticipants: (queue: IStageParticipant[]) => ({ queue, type: 'SET_STAGE_PARTICIPANTS' })
    };
});
vi.mock('./functions.web', () => {
    return {
        getActiveParticipantsIds: (state: IState) =>
            state['features/filmstrip'].activeParticipants.map(p => p.participantId),
        getPinnedActiveParticipants: (state: IState) =>
            state['features/filmstrip'].activeParticipants.filter(p => p.pinned),
        isFilmstripResizable: () => false,
        isStageFilmstripAvailable: () => true,
        isStageFilmstripTopPanel: () => false,
        updateRemoteParticipants: vi.fn(),
        updateRemoteParticipantsOnLeave: vi.fn()
    };
});
vi.mock('./subscriber.web', () => ({}));

/**
 * The stage part of the filmstrip reducer, plus the dominant speaker.
 *
 * @param {IState} state - The current state.
 * @param {AnyAction} action - The dispatched action.
 * @returns {IState}
 */
const reducer = (state: IState | undefined, action: AnyAction): IState => {
    const current = state ?? {
        'features/base/settings': { maxStageParticipants: 1 },
        'features/filmstrip': { activeParticipants: [] }
    };
    const setStage = (activeParticipants: IStageParticipant[]) => {
        return { ...current, 'features/filmstrip': { activeParticipants } };
    };

    switch (action.type) {
    case 'SET_DOMINANT':
        return { ...current, dominant: action.id };
    case SET_STAGE_PARTICIPANTS:
        return setStage(action.queue);
    case REMOVE_STAGE_PARTICIPANT:
        return setStage(current['features/filmstrip'].activeParticipants
            .filter(p => p.participantId !== action.participantId));
    case CLEAR_STAGE_PARTICIPANTS:
        return setStage([]);
    }

    return current;
};

describe('stage filmstrip timers', () => {
    let store: Store<IState, AnyAction>;

    const onStage = () => store.getState()['features/filmstrip'].activeParticipants.map(p => p.participantId);
    const add = (participantId: string, pinned = false) =>
        store.dispatch({ participantId, pinned, type: ADD_STAGE_PARTICIPANT });

    beforeEach(() => {
        vi.useFakeTimers();
        store = createStore(reducer, MiddlewareRegistry.applyMiddleware());
    });

    afterEach(() => {
        // Clears the timers a test left running.
        store.dispatch({ type: CLEAR_STAGE_PARTICIPANTS });
        vi.useRealTimers();
    });

    it('removes an active speaker from the stage after the timeout', () => {
        add('a');

        vi.advanceTimersByTime(ACTIVE_PARTICIPANT_TIMEOUT - 1);
        expect(onStage()).toEqual([ 'a' ]);

        vi.advanceTimersByTime(1);
        expect(onStage()).toEqual([]);
    });

    it('keeps a pinned participant on the stage', () => {
        add('a', true);

        vi.advanceTimersByTime(ACTIVE_PARTICIPANT_TIMEOUT * 2);
        expect(onStage()).toEqual([ 'a' ]);
    });

    it('gives a participant back on the stage the full timeout', () => {
        add('a');
        vi.advanceTimersByTime(ACTIVE_PARTICIPANT_TIMEOUT / 4);

        // The only stage slot goes to b, then back to a.
        add('b');
        expect(onStage()).toEqual([ 'b' ]);
        vi.advanceTimersByTime(ACTIVE_PARTICIPANT_TIMEOUT / 4);
        add('a');
        expect(onStage()).toEqual([ 'a' ]);

        // The timer a got when it first came on the stage must not take it off now.
        vi.advanceTimersByTime(ACTIVE_PARTICIPANT_TIMEOUT / 2);
        expect(onStage()).toEqual([ 'a' ]);

        vi.advanceTimersByTime(ACTIVE_PARTICIPANT_TIMEOUT / 2);
        expect(onStage()).toEqual([]);
    });

    it('drops the timer of a participant pushed off the stage', () => {
        add('a');
        add('b');

        expect(onStage()).toEqual([ 'b' ]);
        expect(vi.getTimerCount()).toBe(1);
    });

    it('removes a participant unpinned while speaking once they stopped being the active speaker', () => {
        add('a', true);
        store.dispatch({ id: 'a', type: 'SET_DOMINANT' });

        store.dispatch({ participantId: 'a', type: TOGGLE_PIN_STAGE_PARTICIPANT });
        expect(store.getState()['features/filmstrip'].activeParticipants).toEqual([ { participantId: 'a', pinned: false } ]);

        // Still the active speaker when the timeout first elapses, so a stays.
        vi.advanceTimersByTime(ACTIVE_PARTICIPANT_TIMEOUT);
        expect(onStage()).toEqual([ 'a' ]);

        store.dispatch({ id: 'x', type: 'SET_DOMINANT' });
        vi.advanceTimersByTime(ACTIVE_PARTICIPANT_TIMEOUT);
        expect(onStage()).toEqual([]);
    });
});

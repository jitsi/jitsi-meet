import { AnyAction, createStore } from 'redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../../base/participants/actionTypes';
import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';

import './middleware';

const { sendEvent } = vi.hoisted(() => {
    return { sendEvent: vi.fn() };
});

vi.mock('react-native', () => {
    return {
        NativeEventEmitter: class {},
        NativeModules: { ExternalAPI: {} }
    };
});

vi.mock('../../../../modules/API/constants', () => ({}));
vi.mock('../../app/actions.native', () => ({}));
vi.mock('../../base/conference/constants', () => ({}));
vi.mock('../../base/conference/functions', () => ({}));
vi.mock('../../base/config/actions', () => ({}));
vi.mock('../../base/config/functions.native', () => ({}));
vi.mock('../../base/connection/constants', () => ({}));
vi.mock('../../base/connection/utils', () => ({}));
vi.mock('../../base/lib-jitsi-meet', () => ({}));
vi.mock('../../base/media/actions', () => ({}));
vi.mock('../../base/tracks/actions.native', () => ({}));
vi.mock('../../base/tracks/constants', () => ({}));
vi.mock('../../base/tracks/functions.native', () => ({}));
vi.mock('../../chat/actions.native', () => ({}));
vi.mock('../../dropbox/functions.native', () => ({}));
vi.mock('../../notifications/actions', () => ({}));
vi.mock('../../notifications/constants', () => ({}));
vi.mock('../../recording/constants', () => ({}));
vi.mock('../../recording/functions', () => ({}));
vi.mock('../../subtitles/actions.any', () => ({}));
vi.mock('../../video-menu/actions.native', () => ({}));
vi.mock('../react-native-sdk/functions', () => ({ isExternalAPIAvailable: () => true }));
vi.mock('./actions', () => ({}));
vi.mock('./logger', () => ({ default: {} }));

vi.mock('./functions', () => {
    return {
        participantToParticipantInfo: (participant: { id: string; }) => ({ id: participant.id }),
        sendEvent
    };
});

vi.mock('../../base/participants/functions', () => {
    const isScreenShareParticipant = (participant?: { fakeParticipant?: string; }) =>
        participant?.fakeParticipant === 'RemoteScreenShare';

    return {
        isScreenShareParticipant,
        isScreenShareParticipantById: (state: any, id: string) =>
            isScreenShareParticipant(state['features/base/participants'].remote.get(id))
    };
});

const createTestStore = () => {
    const reducer = (state: any = {
        'features/base/conference': { conference: {} },
        'features/base/media': { audio: { muted: false } },
        'features/base/participants': { remote: new Map() }
    }, action: AnyAction) => {
        const remote = new Map(state['features/base/participants'].remote);

        if (action.type === PARTICIPANT_JOINED) {
            remote.set(action.participant.id, action.participant);
        } else if (action.type === PARTICIPANT_LEFT) {
            remote.delete(action.participant.id);
        } else {
            return state;
        }

        return {
            ...state,
            'features/base/participants': { remote }
        };
    };

    return createStore(reducer, MiddlewareRegistry.applyMiddleware());
};

const sentEvents = () => sendEvent.mock.calls.map(
    ([ , type, data ]: [ unknown, string, { id: string; } ]) => `${type} ${data.id}`);

describe('mobile external API middleware', () => {
    beforeEach(() => {
        sendEvent.mockClear();
    });

    it('does not report a screen share tile joining or leaving', () => {
        const store = createTestStore();
        const tile = {
            fakeParticipant: 'RemoteScreenShare',
            id: 'abcd-v1'
        };

        store.dispatch({
            participant: tile,
            type: PARTICIPANT_JOINED
        });
        store.dispatch({
            participant: tile,
            type: PARTICIPANT_LEFT
        });

        expect(sentEvents()).toEqual([]);
    });

    it('reports a participant joining and leaving', () => {
        const store = createTestStore();
        const participant = { id: 'abcd' };

        store.dispatch({
            participant,
            type: PARTICIPANT_JOINED
        });
        store.dispatch({
            participant,
            type: PARTICIPANT_LEFT
        });

        expect(sentEvents()).toEqual([ `${PARTICIPANT_JOINED} abcd`, `${PARTICIPANT_LEFT} abcd` ]);
    });
});

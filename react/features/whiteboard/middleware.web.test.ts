import { AnyAction, createStore } from 'redux';
import { describe, expect, it, vi } from 'vitest';

import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { SET_WHITEBOARD_OPEN } from './actionTypes';
import './middleware.web';

const { logger } = vi.hoisted(() => {
    return {
        logger: {
            error: vi.fn(),
            info: vi.fn()
        }
    };
});

vi.mock('@jitsi/excalidraw', () => {
    throw new Error('Loading chunk excalidraw failed');
});

vi.mock('../base/conference/functions', () => ({ getCurrentConference: () => undefined }));
vi.mock('../base/dialog/actions', () => ({}));
vi.mock('../base/dialog/functions', () => ({}));
vi.mock('../base/participants/actions', () => ({}));
vi.mock('../base/participants/types', () => ({ FakeParticipant: {} }));
vi.mock('../breakout-rooms/functions', () => ({ getCurrentRoomId: () => 'room' }));
vi.mock('../filmstrip/actions.web', () => ({}));
vi.mock('../filmstrip/functions.web', () => ({}));
vi.mock('./actions', () => ({}));
vi.mock('./components/web/WhiteboardLimitDialog', () => ({ default: {} }));
vi.mock('./constants', () => ({}));
vi.mock('./logger', () => ({ default: logger }));
vi.mock('./middleware.any', () => ({}));
vi.mock('./types', () => ({ WhiteboardStatus: {} }));

vi.mock('./functions', () => {
    return {
        generateCollabServerUrl: () => 'https://collab.example.com',
        getCollabDetails: () => undefined,
        getCollabServerUrl: () => undefined,
        isWhiteboardPresent: () => false,
        shouldEnforceUserLimit: () => false,
        shouldNotifyUserLimit: () => false
    };
});

vi.mock('../notifications/actions', () => {
    return {
        showErrorNotification: (props: object) => ({
            props,
            type: 'SHOW_ERROR_NOTIFICATION'
        })
    };
});

vi.mock('../notifications/constants', () => ({ NOTIFICATION_TIMEOUT_TYPE: { MEDIUM: 'medium' } }));

describe('whiteboard middleware', () => {
    const createTestStore = () => {
        const actions: AnyAction[] = [];
        const store = createStore((state = { 'features/base/config': {} }, action) => {
            actions.push(action);

            return state;
        }, MiddlewareRegistry.applyMiddleware());

        return {
            actions,
            store
        };
    };

    describe('SET_WHITEBOARD_OPEN', () => {
        it('tells the user when a new whiteboard cannot be created', async () => {
            const { actions, store } = createTestStore();

            store.dispatch({
                isOpen: true,
                type: SET_WHITEBOARD_OPEN,
                userInitiated: true
            });

            await vi.waitFor(() => expect(actions.map(action => action.type)).toContain('SHOW_ERROR_NOTIFICATION'));

            expect(actions.find(action => action.type === 'SHOW_ERROR_NOTIFICATION')?.props).toEqual({
                titleKey: 'info.noWhiteboard'
            });
        });

        it('only logs the failure when the user did not ask for the whiteboard', async () => {
            logger.error.mockClear();

            const { actions, store } = createTestStore();

            store.dispatch({
                isOpen: true,
                type: SET_WHITEBOARD_OPEN
            });

            await vi.waitFor(() => expect(logger.error).toHaveBeenCalledWith('Whiteboard open failed', expect.any(Error)));

            expect(actions.map(action => action.type)).not.toContain('SHOW_ERROR_NOTIFICATION');
        });
    });
});

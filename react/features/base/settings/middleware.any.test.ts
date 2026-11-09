import { AnyAction, createStore } from 'redux';
import { describe, expect, it, vi } from 'vitest';

import { SET_LOCATION_URL } from '../connection/actionTypes';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import './middleware.any';

vi.mock('../participants/actions', () => {
    return {
        participantUpdated: (participant: object) => ({
            participant,
            type: 'PARTICIPANT_UPDATED_TEST'
        })
    };
});

vi.mock('../participants/functions', () => {
    return {
        getLocalParticipant: () => {
            return {
                email: 'saved@example.com',
                id: 'local',
                name: 'Saved name'
            };
        }
    };
});

vi.mock('./actions', () => {
    return {
        updateSettings: (settings: object) => ({
            settings,
            type: 'UPDATE_SETTINGS_TEST'
        })
    };
});

const loadURL = (url: string) => {
    const actions: AnyAction[] = [];
    const store = createStore((state = {}, action) => {
        actions.push(action);

        return action.type === SET_LOCATION_URL
            ? { 'features/base/connection': { locationURL: new URL(url) } }
            : state;
    }, MiddlewareRegistry.applyMiddleware());

    store.dispatch({
        locationURL: new URL(url),
        type: SET_LOCATION_URL
    });

    return {
        participant: actions.find(action => action.type === 'PARTICIPANT_UPDATED_TEST')?.participant,
        settings: actions.find(action => action.type === 'UPDATE_SETTINGS_TEST')?.settings
    };
};

describe('settings middleware', () => {
    describe('userInfo in the URL', () => {
        it('keeps the saved display name when the URL only sets the email', () => {
            const { participant, settings } = loadURL('https://meet.example.com/room#userInfo.email="new@example.com"');

            expect(settings).toEqual({ email: 'new@example.com' });
            expect(participant).toMatchObject({
                email: 'new@example.com',
                name: 'Saved name'
            });
        });

        it('keeps the saved email when the URL only sets the display name', () => {
            const { participant, settings } = loadURL('https://meet.example.com/room#userInfo.displayName="Alice"');

            expect(settings).toEqual({ displayName: 'Alice' });
            expect(participant).toMatchObject({
                email: 'saved@example.com',
                name: 'Alice'
            });
        });

        it('sets both when the URL has both', () => {
            const { settings } = loadURL(
                'https://meet.example.com/room#userInfo.displayName="Alice"&userInfo.email="new@example.com"');

            expect(settings).toEqual({
                displayName: 'Alice',
                email: 'new@example.com'
            });
        });

        it('escapes the values', () => {
            const { settings } = loadURL('https://meet.example.com/room#userInfo.displayName="<b>Alice</b>"');

            expect(settings?.displayName).toBe('&lt;b&gt;Alice&lt;/b&gt;');
        });
    });
});

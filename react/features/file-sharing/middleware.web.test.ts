import { AnyAction, createStore } from 'redux';
import { describe, expect, it, vi } from 'vitest';

import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { UPLOAD_FILES } from './actionTypes';
import './middleware.web';

const { currentConference } = vi.hoisted(() => {
    return { currentConference: { value: undefined as any } };
});

vi.mock('../base/conference/functions', () => {
    return { getCurrentConference: () => currentConference.value };
});

vi.mock('../base/lib-jitsi-meet', () => ({ JitsiConferenceEvents: {} }));
vi.mock('../base/participants/functions', () => ({}));
vi.mock('../chat/actions.any', () => ({}));
vi.mock('../chat/constants', () => ({}));
vi.mock('../visitors/actionTypes', () => ({ I_AM_VISITOR_MODE: 'I_AM_VISITOR_MODE' }));
vi.mock('./actions', () => ({}));
vi.mock('./functions.any', () => ({}));
vi.mock('./logger', () => ({ default: { warn: () => undefined } }));
vi.mock('./utils', () => ({}));

vi.mock('../notifications/actions', () => {
    return {
        showErrorNotification: (props: object) => ({
            props,
            type: 'SHOW_ERROR_NOTIFICATION'
        })
    };
});

vi.mock('../notifications/constants', () => {
    return {
        NOTIFICATION_TIMEOUT_TYPE: { STICKY: 'sticky' },
        NOTIFICATION_TYPE: { ERROR: 'error' }
    };
});

describe('file sharing middleware', () => {
    describe('UPLOAD_FILES', () => {
        it('tells the user when the credentials for the upload cannot be fetched', async () => {
            currentConference.value = {
                getFileSharing: () => ({ getIdentityType: () => 'jwt' }),
                getShortTermCredentials: () => Promise.reject(new Error('no credentials'))
            };

            const actions: AnyAction[] = [];
            const store = createStore((state = {}, action) => {
                actions.push(action);

                return state;
            }, MiddlewareRegistry.applyMiddleware());

            store.dispatch({
                files: [ {} ],
                type: UPLOAD_FILES
            });

            await vi.waitFor(() => expect(actions.map(action => action.type)).toContain('SHOW_ERROR_NOTIFICATION'));

            expect(actions.find(action => action.type === 'SHOW_ERROR_NOTIFICATION')?.props).toMatchObject({
                descriptionKey: 'fileSharing.uploadFailedDescription',
                titleKey: 'fileSharing.uploadFailedTitle'
            });
            expect(actions.map(action => action.type)).toContain(UPLOAD_FILES);
        });
    });
});

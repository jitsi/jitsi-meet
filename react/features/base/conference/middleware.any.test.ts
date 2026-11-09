import { AnyAction, createStore } from 'redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { TRACK_ADDED, TRACK_CREATE_CANCELED } from '../tracks/actionTypes';

import { CONFERENCE_FAILED } from './actionTypes';
import './middleware.any';

const { currentConference } = vi.hoisted(() => {
    return { currentConference: { value: undefined as any } };
});

vi.mock('../../../../modules/API/constants', () => ({ MIN_ASSUMED_BANDWIDTH_BPS: 0 }));
vi.mock('../../analytics/AnalyticsEvents', () => ({}));
vi.mock('../../analytics/functions', () => ({}));
vi.mock('../../app/actions', () => ({}));
vi.mock('../../authentication/actions.any', () => ({}));
vi.mock('../../authentication/functions.any', () => ({}));
vi.mock('../../chat/actions.any', () => ({}));
vi.mock('../../display-name/actions', () => ({}));
vi.mock('../../jaas/functions', () => ({}));
vi.mock('../../notifications/actions', () => ({ showErrorNotification: () => ({ type: 'SHOW_ERROR_NOTIFICATION' }) }));
vi.mock('../../notifications/constants', () => ({ NOTIFICATION_TIMEOUT_TYPE: {} }));
vi.mock('../../prejoin/utils', () => ({}));
vi.mock('../../recording/actions.any', () => ({}));
vi.mock('../../recording/components/Recording/LocalRecordingManager', () => {
    return { default: { isRecordingLocally: () => false } };
});
vi.mock('../../stream-effects/audio-mixer/AudioMixerEffect', () => ({ AudioMixerEffect: class {} }));
vi.mock('../../visitors/functions', () => ({ iAmVisitor: () => false }));
vi.mock('../config/actions', () => ({ overwriteConfig: () => ({ type: 'OVERWRITE_CONFIG' }) }));
vi.mock('../config/functions.any', () => ({}));
vi.mock('../connection/actions', () => ({ disconnect: () => ({ type: 'DISCONNECT' }) }));
vi.mock('../jwt/functions', () => ({}));
vi.mock('../lib-jitsi-meet/functions', () => ({}));
vi.mock('../participants/functions', () => ({}));
vi.mock('../tracks/functions.any', () => ({ getLocalTrack: () => undefined }));
vi.mock('../util/uri', () => ({}));
vi.mock('./actions', () => ({ conferenceWillLeave: () => ({ type: 'CONFERENCE_WILL_LEAVE_TEST' }) }));
vi.mock('./logger', () => ({ default: {
    error: () => undefined,
    info: () => undefined
} }));

vi.mock('../lib-jitsi-meet', () => {
    return {
        JitsiConferenceErrors: { CONFERENCE_MAX_USERS: 'conference.max_users' },
        JitsiConferenceEvents: {},
        JitsiConnectionErrors: {}
    };
});

vi.mock('./functions', () => {
    return {
        getCurrentConference: () => currentConference.value,
        restoreConferenceOptions: () => ({ restored: true })
    };
});

const createTestStore = (state: object = {}) => {
    const actions: AnyAction[] = [];
    const store = createStore((current = state, action) => {
        actions.push(action);

        return current;
    }, MiddlewareRegistry.applyMiddleware());

    return {
        actions,
        store
    };
};

describe('conference middleware', () => {
    describe('CONFERENCE_FAILED with the max users error', () => {
        it('disconnects even when leaving the conference fails', async () => {
            const { actions, store } = createTestStore({ 'features/base/config': {} });

            store.dispatch({
                conference: { leave: () => Promise.reject(new Error('leave timed out')) },
                error: {
                    name: 'conference.max_users',
                    params: []
                },
                type: CONFERENCE_FAILED
            });

            await vi.waitFor(() => expect(actions.map(action => action.type)).toContain('DISCONNECT'));
        });
    });

    describe('TRACK_ADDED while sharing the screen with audio', () => {
        const desktopAudioTrack = {};
        const state = { 'features/screen-share': { desktopAudioTrack } };

        beforeEach(() => {
            vi.stubGlobal('APP', {});
        });

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        const createTrack = (setEffect: () => Promise<void>) => {
            return {
                jitsiTrack: {
                    dispose: vi.fn(() => Promise.resolve()),
                    setEffect
                },
                local: true,
                mediaType: 'audio'
            };
        };

        it('discards the track and cancels its creation when mixing in the desktop audio fails', async () => {
            currentConference.value = {
                getLocalTracks: () => [],
                replaceTrack: () => Promise.resolve()
            };

            const { actions, store } = createTestStore(state);
            const track = createTrack(() => Promise.reject(new Error('mixing failed')));

            store.dispatch({
                track,
                type: TRACK_ADDED
            });

            await vi.waitFor(() => expect(actions.map(item => item.type)).toContain(TRACK_CREATE_CANCELED));

            expect(track.jitsiTrack.dispose).toHaveBeenCalledTimes(1);
            expect(actions.find(item => item.type === TRACK_CREATE_CANCELED)).toMatchObject({ trackType: 'audio' });
            expect(actions.map(item => item.type)).not.toContain(TRACK_ADDED);
        });

        it('adds the track once the desktop audio is mixed in', async () => {
            currentConference.value = {
                getLocalTracks: () => [],
                replaceTrack: () => Promise.resolve()
            };

            const { actions, store } = createTestStore(state);
            const track = createTrack(() => Promise.resolve());

            store.dispatch({
                track,
                type: TRACK_ADDED
            });

            await vi.waitFor(() => expect(actions.map(item => item.type)).toContain(TRACK_ADDED));

            expect(track.jitsiTrack.dispose).not.toHaveBeenCalled();
        });
    });
});

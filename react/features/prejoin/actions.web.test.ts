import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SET_DEVICE_STATUS } from './actionTypes';
import { replaceAudioTrackById, replaceVideoTrackById } from './actions.web';

const { createLocalTrack, createLocalTracksF, isVideoMutedByUser } = vi.hoisted(() => {
    return {
        createLocalTrack: vi.fn(),
        createLocalTracksF: vi.fn(),
        isVideoMutedByUser: vi.fn(() => false)
    };
});

vi.mock('../base/config/actions', () => ({}));
vi.mock('../base/config/functions', () => ({}));
vi.mock('../base/connection/actions', () => ({}));
vi.mock('../base/util/openURLInBrowser', () => ({}));
vi.mock('../invite/functions', () => ({}));
vi.mock('../notifications/actions', () => ({}));
vi.mock('./functions.any', () => ({}));
vi.mock('./logger', () => ({ default: {
    info: () => undefined,
    log: () => undefined
} }));

vi.mock('../base/lib-jitsi-meet/functions', () => {
    return { createLocalTrack };
});

vi.mock('../base/media/functions', () => {
    return { isVideoMutedByUser };
});

vi.mock('../base/settings/actions', () => {
    return { updateSettings: (settings: object) => ({
        settings,
        type: 'UPDATE_SETTINGS'
    }) };
});

vi.mock('../base/tracks/actions', () => {
    return { replaceLocalTrack: () => ({ type: 'REPLACE_LOCAL_TRACK' }) };
});

vi.mock('../base/tracks/functions', () => {
    return {
        createLocalTracksF,
        getLocalAudioTrack: () => undefined,
        getLocalVideoTrack: () => undefined
    };
});

describe('prejoin device switching', () => {
    let settleReplace: { reject: (error: Error) => void; resolve: () => void; };
    let dispatched: Array<{ type: string; }>;
    let dispatch: any;

    const getState = () => {
        return { 'features/base/tracks': [] } as any;
    };

    beforeEach(() => {
        dispatched = [];
        dispatch = (action: { type: string; }) => {
            dispatched.push(action);

            if (action.type === 'REPLACE_LOCAL_TRACK') {
                return new Promise<void>((resolve, reject) => {
                    settleReplace = {
                        reject,
                        resolve
                    };
                });
            }
        };
    });

    describe('replaceAudioTrackById', () => {
        beforeEach(() => {
            createLocalTrack.mockResolvedValue({ getDeviceId: () => 'new-mic' });
        });

        it('saves the microphone once the track was replaced', async () => {
            const done = replaceAudioTrackById('new-mic')(dispatch, getState);

            await vi.waitFor(() => expect(settleReplace).toBeDefined());
            settleReplace.resolve();
            await done;

            expect(dispatched.map(action => action.type)).toEqual([ 'REPLACE_LOCAL_TRACK', 'UPDATE_SETTINGS' ]);
            expect(dispatched[1]).toMatchObject({ settings: { micDeviceId: 'new-mic' } });
        });

        it('shows the device warning and keeps the saved microphone when replacing the track fails', async () => {
            const done = replaceAudioTrackById('new-mic')(dispatch, getState);

            await vi.waitFor(() => expect(settleReplace).toBeDefined());
            settleReplace.reject(new Error('replace failed'));
            await done;

            expect(dispatched.map(action => action.type)).toEqual([ 'REPLACE_LOCAL_TRACK', SET_DEVICE_STATUS ]);
            expect(dispatched[1]).toMatchObject({ value: { deviceStatusText: 'prejoin.audioTrackError' } });
        });
    });

    describe('replaceVideoTrackById', () => {
        const newTrack = {
            getDeviceId: () => 'new-camera',
            mute: vi.fn()
        };

        beforeEach(() => {
            newTrack.mute.mockClear();
            isVideoMutedByUser.mockReturnValue(false);
            createLocalTracksF.mockResolvedValue([ newTrack ]);
        });

        it('saves the camera once the track was replaced', async () => {
            const done = replaceVideoTrackById('new-camera')(dispatch, getState);

            await vi.waitFor(() => expect(settleReplace).toBeDefined());
            settleReplace.resolve();
            await done;

            expect(dispatched.map(action => action.type)).toEqual([ 'REPLACE_LOCAL_TRACK', 'UPDATE_SETTINGS' ]);
            expect(dispatched[1]).toMatchObject({ settings: { cameraDeviceId: 'new-camera' } });
        });

        it('shows the device warning and keeps the saved camera when replacing the track fails', async () => {
            const done = replaceVideoTrackById('new-camera')(dispatch, getState);

            await vi.waitFor(() => expect(settleReplace).toBeDefined());
            settleReplace.reject(new Error('replace failed'));
            await done;

            expect(dispatched.map(action => action.type)).toEqual([ 'REPLACE_LOCAL_TRACK', SET_DEVICE_STATUS ]);
            expect(dispatched[1]).toMatchObject({ value: { deviceStatusText: 'prejoin.videoTrackError' } });
        });

        it('mutes the new track right away when the video was muted, without waiting for the replacement', async () => {
            isVideoMutedByUser.mockReturnValue(true);

            const done = replaceVideoTrackById('new-camera')(dispatch, getState);

            await vi.waitFor(() => expect(settleReplace).toBeDefined());

            expect(newTrack.mute).toHaveBeenCalledTimes(1);
            expect(dispatched.map(action => action.type)).toEqual([ 'REPLACE_LOCAL_TRACK' ]);

            settleReplace.resolve();
            await done;
        });
    });
});

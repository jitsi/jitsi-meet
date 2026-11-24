// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setAudioOutputDevice } from './actions.web';

const mocks = vi.hoisted(() => {
    return {
        isAudioOutputManagerEnabled: vi.fn(),
        sendAnalytics: vi.fn(),
        setAudioOutputDeviceId: vi.fn(),
        setSinkId: vi.fn()
    };
});

// Keep the import graph away from i18n, which needs a browser.
vi.mock('../../analytics/functions', () => ({ sendAnalytics: mocks.sendAnalytics }));
vi.mock('../../notifications/actions', () => ({
    showWarningNotification: (props: object) => ({ props, type: 'WARNING' })
}));
vi.mock('../lib-jitsi-meet', () => {
    return {
        default: {
            mediaDevices: {
                isDeviceChangeAvailable: () => true,
                setAudioOutputDevice: mocks.setSinkId
            }
        }
    };
});
vi.mock('../settings/actions', () => ({ updateSettings: (settings: object) => ({ settings, type: 'SETTINGS' }) }));
vi.mock('../settings/functions.web', () => ({}));
vi.mock('../sounds/functions.web', () => ({
    setNewAudioOutputDevice: (deviceId: string) => ({ deviceId, type: 'SOUNDS' })
}));
vi.mock('./functions', () => {
    return {
        getDeviceLabelById: () => 'Speaker',
        isAudioOutputManagerEnabled: mocks.isAudioOutputManagerEnabled,
        setAudioOutputDeviceId: mocks.setAudioOutputDeviceId
    };
});
vi.mock('./logger', () => ({ default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

const deferred = () => {
    let resolve: (value: unknown) => void = () => undefined;
    let reject: (error: Error) => void = () => undefined;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, reject, resolve };
};

describe('setAudioOutputDevice', () => {
    let dispatch: ReturnType<typeof vi.fn>;

    const run = (deviceId: string, userSelection?: boolean) =>
        setAudioOutputDevice(deviceId, userSelection)(dispatch as any, () => ({}) as any);
    const dispatched = (type: string) => dispatch.mock.calls.map(([ action ]) => action).filter(a => a?.type === type);
    const notices = () => dispatched('WARNING').map(a => a.props.titleKey);
    const results = () => mocks.sendAnalytics.mock.calls.map(([ event ]) => event.attributes);

    beforeEach(() => {
        vi.clearAllMocks();
        dispatch = vi.fn(action => action);
        mocks.isAudioOutputManagerEnabled.mockReturnValue(true);
        mocks.setSinkId.mockResolvedValue([]);
    });

    describe('without the audio output manager', () => {
        beforeEach(() => {
            mocks.isAudioOutputManagerEnabled.mockReturnValue(false);
        });

        it('runs the previous implementation and reports the outcome', async () => {
            mocks.setAudioOutputDeviceId.mockResolvedValue(undefined);

            expect(await run('speaker-2')).toBe(true);
            expect(mocks.setAudioOutputDeviceId).toHaveBeenCalledWith('speaker-2', dispatch, true, 'Speaker');
            expect(mocks.setSinkId).not.toHaveBeenCalled();
            expect(results()).toEqual([ expect.objectContaining({ manager: false, result: 'changed' }) ]);
        });

        it('shows no notice when it fails', async () => {
            mocks.setAudioOutputDeviceId.mockRejectedValue(new DOMException('aborted', 'AbortError'));

            expect(await run('speaker-2')).toBe(false);
            expect(notices()).toEqual([]);
            expect(results()).toEqual([ expect.objectContaining({ error: 'AbortError', result: 'failed' }) ]);
        });
    });

    describe('with the audio output manager', () => {
        it('saves the device the user picked once it switched', async () => {
            expect(await run('speaker-2')).toBe(true);

            expect(dispatched('SOUNDS')).toEqual([ { deviceId: 'speaker-2', type: 'SOUNDS' } ]);
            expect(dispatched('SETTINGS')).toEqual([ {
                settings: {
                    audioOutputDeviceId: 'speaker-2',
                    userSelectedAudioOutputDeviceId: 'speaker-2',
                    userSelectedAudioOutputDeviceLabel: 'Speaker'
                },
                type: 'SETTINGS'
            } ]);
            expect(notices()).toEqual([]);
            expect(results()).toEqual([
                expect.objectContaining({ manager: true, result: 'changed', userSelection: true })
            ]);
        });

        it('does not save a device the app picked as the user\'s', async () => {
            await run('speaker-2', false);

            expect(dispatched('SETTINGS')).toEqual([
                { settings: { audioOutputDeviceId: 'speaker-2' }, type: 'SETTINGS' }
            ]);
            expect(results()).toEqual([ expect.objectContaining({ userSelection: false }) ]);
        });

        it('saves nothing and tells the user when their switch fails', async () => {
            mocks.setSinkId.mockRejectedValue(new DOMException('aborted', 'AbortError'));

            expect(await run('speaker-2')).toBe(false);
            expect(dispatched('SETTINGS')).toEqual([]);
            expect(notices()).toEqual([ 'notify.audioOutputChangeFailedTitle' ]);
        });

        it('does not tell the user when a switch the app made fails', async () => {
            mocks.setSinkId.mockRejectedValue(new DOMException('aborted', 'AbortError'));

            expect(await run('speaker-2', false)).toBe(false);
            expect(notices()).toEqual([]);
        });

        it('saves the device and tells the user when some participants did not switch', async () => {
            mocks.setSinkId.mockResolvedValue([ {} ]);

            expect(await run('speaker-2')).toBe(true);
            expect(dispatched('SETTINGS')).toHaveLength(1);
            expect(notices()).toEqual([ 'notify.audioOutputPartlyChangedTitle' ]);
            expect(results()).toEqual([ expect.objectContaining({ failed: 1, result: 'partly' }) ]);
        });

        it('ignores the outcome of a switch that a newer one followed', async () => {
            const first = deferred();

            mocks.setSinkId.mockReturnValueOnce(first.promise);

            const older = run('speaker-2');

            expect(await run('speaker-3')).toBe(true);
            first.reject(new DOMException('superseded', 'SupersededError'));

            expect(await older).toBe(false);
            expect(dispatched('SETTINGS').map(a => a.settings.audioOutputDeviceId)).toEqual([ 'speaker-3' ]);
            expect(notices()).toEqual([]);
        });

        it('ignores a switch the app makes while one the user asked for is running', async () => {
            const users = deferred();

            mocks.setSinkId.mockReturnValueOnce(users.promise);

            const user = run('speaker-2');

            expect(await run('speaker-1', false)).toBe(false);
            expect(mocks.setSinkId).toHaveBeenCalledTimes(1);

            users.resolve([]);
            expect(await user).toBe(true);
            expect(dispatched('SETTINGS').map(a => a.settings.audioOutputDeviceId)).toEqual([ 'speaker-2' ]);

            expect(await run('speaker-1', false)).toBe(true);
        });
    });
});

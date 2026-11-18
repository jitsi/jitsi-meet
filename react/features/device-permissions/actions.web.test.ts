import { beforeEach, describe, expect, it, vi } from 'vitest';

import { explainBeforePrompt, handleEndedTrack, retryDevices, showPermissionGuidance } from './actions.web';

const mocks = vi.hoisted(() => {
    return {
        createLocalTracksF: vi.fn(),
        isDialogOpen: vi.fn(),
        isMobileBrowser: vi.fn(),
        isPrejoinPageVisible: vi.fn(),
        isToolboxVisible: vi.fn(),
        querySelector: vi.fn()
    };
});

vi.mock('react-redux', () => ({ batch: (fn: () => void) => fn() }));
vi.mock('../base/devices/actions.web', () => ({
    notifyCameraError: (error: Error) => ({ error, type: 'NOTIFY_CAMERA_ERROR' }),
    notifyMicError: (error: Error) => ({ error, type: 'NOTIFY_MIC_ERROR' })
}));
vi.mock('../base/dialog/actions', () => ({
    openDialog: (name: string, _component: unknown, props: object) => ({ name, props, type: 'OPEN_DIALOG' })
}));
vi.mock('../base/dialog/functions', () => ({ isDialogOpen: mocks.isDialogOpen }));
vi.mock('../base/environment/environment', () => ({ isMacOS: () => true, isWindows: () => false }));
vi.mock('../base/environment/utils', () => ({ isMobileBrowser: mocks.isMobileBrowser }));
vi.mock('../base/lib-jitsi-meet', () => ({
    JitsiTrackErrors: { PERMISSION_DENIED: 'gum.permission_denied' },
    browser: {}
}));
vi.mock('../base/tracks/actions.any', () => ({
    createLocalTracksA: (options: object) => ({ options, type: 'CREATE_LOCAL_TRACKS' })
}));
vi.mock('../base/tracks/functions.any', () => ({
    getLocalTrack: (tracks: any[], kind: string, includePending = false) =>
        tracks.find(t => t.mediaType === kind && (includePending || t.jitsiTrack))
}));
vi.mock('../base/tracks/functions.web', () => ({ createLocalTracksF: mocks.createLocalTracksF }));
vi.mock('../prejoin/actions.web', () => ({
    setDeviceStatusOk: (text: string) => ({ text, type: 'DEVICE_STATUS_OK' })
}));
vi.mock('../prejoin/functions', () => ({ isPrejoinPageVisible: mocks.isPrejoinPageVisible }));
vi.mock('../settings/actions.web', () => ({
    setVideoSettingsVisibility: (value: boolean) => ({ type: 'VIDEO_SETTINGS', value })
}));
vi.mock('../toolbox/functions.web', () => ({ isToolboxVisible: mocks.isToolboxVisible }));
vi.mock('./components/web/PermissionBlockedDialog', () => ({ default: 'PermissionBlockedDialog' }));
vi.mock('./components/web/PermissionPromptDialog', () => ({ default: 'PermissionPromptDialog' }));
vi.mock('./logger', () => ({ default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

// The camera button of the main toolbar, looked up in the page.
vi.stubGlobal('document', { querySelector: mocks.querySelector });

describe('explainBeforePrompt', () => {
    let dispatch: ReturnType<typeof vi.fn>;
    let state: any;

    const run = (kinds: Array<'audio' | 'video'>, whenUnmuting?: boolean) =>
        explainBeforePrompt(kinds, whenUnmuting)(dispatch as any, () => state);
    const dispatched = (type: string) => dispatch.mock.calls.map(([ action ]) => action).filter(a => a?.type === type);

    beforeEach(() => {
        vi.clearAllMocks();
        dispatch = vi.fn(action => {
            if (typeof action === 'function') {
                return action(dispatch, () => state);
            }
            if (action.type === 'SET_VIDEO_PERMISSION_PROMPT') {
                state['features/device-permissions'] = { videoPrompt: action.prompt };
            }

            return action;
        });
        state = {
            'features/base/config': {},
            'features/base/devices': {
                permissionStatus: {
                    audio: { state: 'prompt' },
                    video: { state: 'prompt' }
                }
            },
            'features/base/responsive-ui': { isNarrowLayout: false },
            'features/device-permissions': {}
        };
        mocks.querySelector.mockReturnValue({});
        mocks.isMobileBrowser.mockReturnValue(false);
        mocks.isPrejoinPageVisible.mockReturnValue(false);
        mocks.isToolboxVisible.mockReturnValue(true);
    });

    it('goes ahead without asking when the browser won\'t prompt', async () => {
        state['features/base/devices'].permissionStatus.video = { state: 'granted' };

        expect(await run([ 'video' ], true)).toEqual([ 'video' ]);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it.each([
        [ 'the explanation is turned off', () => {
            state['features/base/config'].disablePermissionPromptDialog = true;
        } ],
        [ 'the UI is reduced, which shows no dialogs', () => {
            state['features/base/responsive-ui'].reducedUI = true;
        } ]
    ])('goes ahead without asking when %s', async (_, setUp) => {
        setUp();

        expect(await run([ 'audio', 'video' ])).toEqual([ 'audio', 'video' ]);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('goes ahead with the devices the browser won\'t prompt for when the user declines', async () => {
        state['features/base/devices'].permissionStatus.audio = { state: 'granted' };

        const answer = run([ 'audio', 'video' ]);
        const [ { props } ] = dispatched('OPEN_DIALOG');

        expect(props.kinds).toEqual([ 'video' ]);
        props.onDone(false);
        expect(await answer).toEqual([ 'audio' ]);
    });

    it('asks above the camera button when the camera is unmuted from the toolbar', async () => {
        const answer = run([ 'video' ], true);

        expect(dispatched('OPEN_DIALOG')).toEqual([]);
        expect(dispatched('VIDEO_SETTINGS')).toEqual([ { type: 'VIDEO_SETTINGS', value: true } ]);

        const { videoPrompt } = state['features/device-permissions'];

        expect(videoPrompt).toEqual(expect.objectContaining({ id: expect.any(Number), kinds: [ 'video' ], otherKind: 'audio' }));
        videoPrompt.onDone(true);
        expect(await answer).toEqual([ 'video' ]);
    });

    it.each([
        [ 'the toolbar is hidden', () => mocks.isToolboxVisible.mockReturnValue(false) ],
        [ 'the layout is narrow', () => {
            state['features/base/responsive-ui'].isNarrowLayout = true;
        } ],
        [ 'the camera button is in the overflow menu', () => mocks.querySelector.mockReturnValue(null) ],
        [ 'the pre-join screen is shown', () => mocks.isPrejoinPageVisible.mockReturnValue(true) ],
        [ 'it is a mobile browser', () => mocks.isMobileBrowser.mockReturnValue(true) ]
    ])('asks in a dialog when %s', (_, setUp) => {
        setUp();
        run([ 'video' ], true);

        expect(dispatched('SET_VIDEO_PERMISSION_PROMPT')).toEqual([]);
        expect(dispatched('OPEN_DIALOG')).toEqual([
            expect.objectContaining({ name: 'PermissionPromptDialog' })
        ]);
    });

    it('asks in a dialog for the microphone and when joining', () => {
        run([ 'audio' ], true);
        run([ 'audio', 'video' ]);

        expect(dispatched('SET_VIDEO_PERMISSION_PROMPT')).toEqual([]);
        expect(dispatched('OPEN_DIALOG').map(a => a.props.kinds)).toEqual([ [ 'audio' ], [ 'audio', 'video' ] ]);
    });

    it('answers no to the camera request still explained when another one comes', async () => {
        const first = run([ 'video' ], true);

        run([ 'audio' ], true);

        expect(await first).toEqual([]);
        expect(state['features/device-permissions'].videoPrompt).toBeUndefined();
    });
});

describe('handleEndedTrack', () => {
    const conference = {
        useAudioStream: vi.fn(),
        useVideoStream: vi.fn()
    };
    let dispatch: ReturnType<typeof vi.fn>;
    let jitsiTrack: any;
    let state: any;

    const createTrack = (kind: string) => {
        return {
            dispose: vi.fn(),
            getDeviceId: () => `${kind}1`,
            getType: () => kind
        };
    };
    const run = (track = jitsiTrack) => handleEndedTrack(track)(dispatch as any, () => state);
    const useStream = (kind: string) => async (track: any) => {
        state['features/base/tracks'] = state['features/base/tracks']
            .filter((t: any) => t.mediaType !== kind)
            .concat(track ? [ { jitsiTrack: track, mediaType: kind } ] : []);
    };
    const dispatched = () => dispatch.mock.calls.map(([ action ]) => action).filter(a => typeof a !== 'function');

    beforeEach(() => {
        vi.clearAllMocks();
        (globalThis as any).APP = { conference };
        conference.useAudioStream.mockImplementation(useStream('audio'));
        conference.useVideoStream.mockImplementation(useStream('video'));
        dispatch = vi.fn(action => typeof action === 'function' ? action(dispatch, () => state) : action);
        jitsiTrack = createTrack('video');
        state = {
            'features/base/config': {},
            'features/base/devices': {
                availableDevices: {
                    audioInput: [ { deviceId: 'audio1' } ],
                    videoInput: [ { deviceId: 'video1' } ]
                },
                permissionStatus: {
                    audio: { state: 'granted' },
                    video: { state: 'granted' }
                }
            },
            'features/base/dialog': {},
            'features/base/media': {
                audio: { muted: false },
                video: { muted: 0 }
            },
            'features/base/tracks': [ { jitsiTrack, mediaType: 'video' } ]
        };
    });

    it('turns the device off and reports the denial when access was blocked in the browser', async () => {
        state['features/base/devices'].permissionStatus.video = { reason: 'browser', state: 'denied' };

        await run();

        expect(conference.useVideoStream).toHaveBeenCalledWith(null);
        expect(dispatched()).toEqual([
            { error: expect.objectContaining({ name: 'gum.permission_denied' }), type: 'NOTIFY_CAMERA_ERROR' }
        ]);
        expect(mocks.createLocalTracksF).not.toHaveBeenCalled();
    });

    it.each([
        [ 'access was reset in the browser', () => {
            state['features/base/devices'].permissionStatus.video = { state: 'prompt' };
        } ],
        [ 'the device is muted', () => {
            state['features/base/media'].video.muted = 1;
        } ]
    ])('turns the device off without requesting it when %s', async (_, setUp) => {
        setUp();

        await run();

        expect(conference.useVideoStream).toHaveBeenCalledWith(null);
        expect(dispatched()).toEqual([]);
        expect(mocks.createLocalTracksF).not.toHaveBeenCalled();
    });

    it('uses the device again when it can be', async () => {
        const track = createTrack('video');

        mocks.createLocalTracksF.mockResolvedValue([ track ]);

        await run();

        expect(mocks.createLocalTracksF).toHaveBeenCalledWith({ devices: [ 'video' ] });
        expect(conference.useVideoStream).toHaveBeenCalledWith(track);
        expect(dispatched()).toEqual([]);
    });

    it('turns the device off and reports why when it can\'t be used again', async () => {
        const error = new Error('Permission denied by system');

        jitsiTrack = createTrack('audio');
        state['features/base/tracks'] = [ { jitsiTrack, mediaType: 'audio' } ];
        mocks.createLocalTracksF.mockRejectedValue(error);

        await run();

        expect(dispatched()).toEqual([ { error, type: 'NOTIFY_MIC_ERROR' } ]);
        expect(conference.useAudioStream).toHaveBeenCalledWith(null);
    });

    it('requests a device the browser lists without ids', async () => {
        state['features/base/devices'].availableDevices.videoInput = [ { deviceId: '' } ];
        mocks.createLocalTracksF.mockResolvedValue([ createTrack('video') ]);

        await run();

        expect(mocks.createLocalTracksF).toHaveBeenCalled();
    });

    it('leaves an unplugged device to the device list change', async () => {
        state['features/base/devices'].availableDevices.videoInput = [ { deviceId: 'video2' } ];

        await run();

        expect(mocks.createLocalTracksF).not.toHaveBeenCalled();
        expect(conference.useVideoStream).not.toHaveBeenCalled();
    });

    it('deals with a track once, and not with one replaced meanwhile', async () => {
        mocks.createLocalTracksF.mockResolvedValue([ createTrack('video') ]);

        await Promise.all([ run(), run() ]);
        await run(createTrack('video'));

        expect(mocks.createLocalTracksF).toHaveBeenCalledTimes(1);
    });

    it('drops the new track and reports why when it can\'t replace the ended one', async () => {
        const error = new Error('replace failed');
        const track = createTrack('video');

        mocks.createLocalTracksF.mockResolvedValue([ track ]);
        conference.useVideoStream.mockRejectedValue(error);

        await run();

        expect(track.dispose).toHaveBeenCalled();
        expect(dispatched()).toEqual([ { error, type: 'NOTIFY_CAMERA_ERROR' } ]);
    });

    it('drops the new track when the ended one was replaced while requesting the device', async () => {
        const track = createTrack('video');

        mocks.createLocalTracksF.mockImplementation(async () => {
            state['features/base/tracks'] = [ { jitsiTrack: createTrack('video'), mediaType: 'video' } ];

            return [ track ];
        });

        await run();

        expect(track.dispose).toHaveBeenCalled();
        expect(conference.useVideoStream).not.toHaveBeenCalled();
    });
});

describe('retryDevices', () => {
    let dispatch: ReturnType<typeof vi.fn>;
    let state: any;

    const run = (kinds: Array<'audio' | 'video'>) => retryDevices(kinds)(dispatch as any, () => state);
    const dispatched = (type: string) => dispatch.mock.calls.map(([ action ]) => action).filter(a => a?.type === type);

    beforeEach(() => {
        vi.clearAllMocks();
        dispatch = vi.fn(action => {
            if (action.type === 'CREATE_LOCAL_TRACKS') {
                state['features/base/tracks'] = state['features/base/tracks'].concat(action.options.devices.map(
                    (mediaType: string) => ({ jitsiTrack: {}, mediaType })));
            }

            return action;
        });
        state = {
            'features/base/tracks': [],
            'features/prejoin': { deviceStatusText: 'prejoin.errorNoCameraPermission' }
        };
        mocks.isPrejoinPageVisible.mockReturnValue(true);
    });

    it('requests only the devices that have no track, nor one being created', async () => {
        state['features/base/tracks'] = [ { mediaType: 'audio' } ];

        await run([ 'audio', 'video' ]);

        expect(dispatched('CREATE_LOCAL_TRACKS')).toEqual([
            { options: { devices: [ 'video' ] }, type: 'CREATE_LOCAL_TRACKS' }
        ]);
    });
});

describe('showPermissionGuidance', () => {
    let dispatch: ReturnType<typeof vi.fn>;
    let state: any;

    const run = (kinds: Array<'audio' | 'video'>) => showPermissionGuidance(kinds)(dispatch as any, () => state);
    const opened = () => dispatch.mock.calls.map(([ action ]) => action).filter(a => a?.type === 'OPEN_DIALOG');

    beforeEach(() => {
        vi.clearAllMocks();
        dispatch = vi.fn(action => action);
        state = {
            'features/base/config': {},
            'features/base/devices': {
                permissionStatus: {
                    audio: { reason: 'browser', state: 'denied' },
                    video: { reason: 'browser', state: 'denied' }
                }
            },
            'features/base/dialog': {}
        };
        mocks.isDialogOpen.mockReturnValue(false);
    });

    it('adds a device to the guidance already shown', () => {
        mocks.isDialogOpen.mockReturnValue(true);
        state['features/base/dialog'].componentProps = { kinds: [ 'video' ] };

        run([ 'audio' ]);

        expect(opened().map(a => a.props.kinds)).toEqual([ [ 'audio', 'video' ] ]);
    });

    it.each([
        [ 'the guidance is turned off', () => {
            state['features/base/config'].disablePermissionGuidanceDialog = true;
        } ],
        [ 'access to the device isn\'t denied', () => {
            state['features/base/devices'].permissionStatus.audio = { state: 'prompt' };
        } ]
    ])('shows nothing when %s', (_, setUp) => {
        setUp();

        run([ 'audio' ]);

        expect(opened()).toEqual([]);
    });
});

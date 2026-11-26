import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toggleScreensharing } from './actions.web';

const mocks = vi.hoisted(() => {
    return {
        createLocalTracksF: vi.fn(),
        mixerEffects: [] as Array<{ desktopAudioTrack: unknown; }>
    };
});

// Keep the import graph away from the conference, the UI and i18n, which need a running app.
vi.mock('../../../../modules/UI/UIErrors', () => ({ AUDIO_ONLY_SCREEN_SHARE_NO_TRACK: 'no-audio-track' }));
vi.mock('../../av-moderation/actions', () => ({ showModeratedNotification: vi.fn() }));
vi.mock('../../av-moderation/constants', () => ({ MEDIA_TYPE: { DESKTOP: 'desktop' } }));
vi.mock('../../av-moderation/functions', () => ({ shouldShowModeratedNotification: () => false }));
vi.mock('../../noise-suppression/actions', () => ({ setNoiseSuppressionEnabled: () => ({ type: 'NOISE_SUPPRESSION' }) }));
vi.mock('../../notifications/actions', () => {
    return {
        showErrorNotification: (props: object) => ({ props, type: 'ERROR_NOTIFICATION' }),
        showNotification: (props: object) => ({ props, type: 'NOTIFICATION' })
    };
});
vi.mock('../../notifications/constants', () => ({ NOTIFICATION_TIMEOUT_TYPE: {} }));
vi.mock('../../remote-control/actions', () => ({ stopReceiver: () => ({ type: 'STOP_RECEIVER' }) }));
vi.mock('../../screen-share/actions', () => {
    return {
        setScreenAudioShareState: (enabled: boolean) => ({ enabled, type: 'SCREEN_AUDIO_SHARE_STATE' }),
        setScreenshareAudioTrack: (track: unknown) => ({ track, type: 'SCREENSHARE_AUDIO_TRACK' })
    };
});
vi.mock('../../screen-share/functions', () => ({ isAudioOnlySharing: () => false, isScreenVideoShared: () => false }));
vi.mock('../../screenshot-capture/actions', () => ({ toggleScreenshotCaptureSummary: vi.fn() }));
vi.mock('../../screenshot-capture/functions', () => ({ isScreenshotCaptureEnabled: () => false }));
vi.mock('../../settings/actions.web', () => ({ setAudioSettings: vi.fn() }));
vi.mock('../../stream-effects/audio-mixer/AudioMixerEffect', () => {
    return {
        AudioMixerEffect: class {
            desktopAudioTrack: unknown;

            constructor(desktopAudioTrack: unknown) {
                this.desktopAudioTrack = desktopAudioTrack;
                mocks.mixerEffects.push(this);
            }
        }
    };
});
vi.mock('../conference/functions', () => ({ getCurrentConference: (state: any) => state.conference }));
vi.mock('../devices/actions.web', () => ({ notifyCameraError: vi.fn(), notifyMicError: vi.fn() }));
vi.mock('../dialog/actions', () => ({ openDialog: vi.fn() }));
vi.mock('../lib-jitsi-meet', () => {
    return {
        JitsiTrackErrors: {},
        JitsiTrackEvents: { LOCAL_TRACK_STOPPED: 'track.stopped' },
        browser: {}
    };
});
vi.mock('../lib-jitsi-meet/functions.any', () => ({ createLocalTrack: vi.fn() }));
vi.mock('../media/actions', () => ({ gumPending: vi.fn(), setScreenshareMuted: vi.fn() }));
vi.mock('../settings/actions', () => ({ updateSettings: vi.fn() }));
vi.mock('./actions.any', () => {
    return {
        addLocalTrack: (track: unknown) => ({ track, type: 'ADD_LOCAL_TRACK' }),
        replaceLocalTrack: vi.fn()
    };
});
vi.mock('./components/web/AllowToggleCameraDialog', () => ({ default: () => null }));
// './functions' resolves to functions.web.ts as well, so a single mock serves both imports.
vi.mock('./functions.web', () => {
    return {
        applyAudioConstraints: vi.fn(),
        createLocalTracksF: mocks.createLocalTracksF,
        getLocalDesktopTrack: () => undefined,
        getLocalJitsiAudioTrack: (state: any) => state.localAudio,
        getLocalJitsiAudioTrackSettings: vi.fn(),
        getLocalVideoTrack: () => undefined,
        isToggleCameraEnabled: () => false
    };
});
vi.mock('./logger', () => ({ default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

const createTrack = (type: string) => {
    return {
        dispose: vi.fn(),
        getType: () => type,
        on: vi.fn(),
        sourceType: 'screen'
    };
};

describe('toggleScreensharing with desktop audio', () => {
    let actions: Array<{ [key: string]: any; type: string; }>;
    let state: { [key: string]: any; };
    let notifyScreenSharingStatusChanged: ReturnType<typeof vi.fn>;
    let desktopAudioTrack: ReturnType<typeof createTrack>;
    let desktopVideoTrack: ReturnType<typeof createTrack>;

    const getState = () => state;
    const dispatch = (action: any): any => {
        if (typeof action === 'function') {
            return action(dispatch, getState);
        }
        actions.push(action);

        return action;
    };
    const ofType = (type: string) => actions.filter(action => action.type === type);

    beforeEach(() => {
        actions = [];
        mocks.mixerEffects.length = 0;
        desktopAudioTrack = createTrack('audio');
        desktopVideoTrack = createTrack('video');
        mocks.createLocalTracksF.mockResolvedValue([ desktopVideoTrack, desktopAudioTrack ]);
        notifyScreenSharingStatusChanged = vi.fn();
        vi.stubGlobal('APP', { API: { notifyScreenSharingStatusChanged } });
        state = {
            'features/base/config': {},
            'features/base/low-bandwidth-mode': { enabled: false },
            'features/base/tracks': [],
            conference: { replaceTrack: vi.fn().mockResolvedValue(undefined) },
            localAudio: { setEffect: vi.fn().mockResolvedValue(undefined) }
        };
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('mixes the desktop audio into the microphone and keeps its track', async () => {
        await dispatch(toggleScreensharing(true, true));

        expect(state.localAudio.setEffect).toHaveBeenCalledWith(mocks.mixerEffects[0]);
        expect(mocks.mixerEffects[0].desktopAudioTrack).toBe(desktopAudioTrack);
        expect(ofType('SCREENSHARE_AUDIO_TRACK')).toEqual([ { track: desktopAudioTrack, type: 'SCREENSHARE_AUDIO_TRACK' } ]);
        expect(ofType('SCREEN_AUDIO_SHARE_STATE')).toEqual([ { enabled: true, type: 'SCREEN_AUDIO_SHARE_STATE' } ]);
        expect(ofType('ERROR_NOTIFICATION')).toHaveLength(0);
    });

    it('uses the microphone track there is once the share picker closes', async () => {
        const localAudio = { setEffect: vi.fn().mockResolvedValue(undefined) };

        // No microphone track when the share starts; one is there by the time the desktop tracks are created.
        state.localAudio = undefined;
        mocks.createLocalTracksF.mockImplementation(async () => {
            state = { ...state, localAudio };

            return [ desktopVideoTrack, desktopAudioTrack ];
        });

        await dispatch(toggleScreensharing(true, true));

        expect(localAudio.setEffect).toHaveBeenCalledTimes(1);
        expect(state.conference.replaceTrack).not.toHaveBeenCalled();
    });

    it('stops an audio-only share whose audio could not be mixed in', async () => {
        state.localAudio.setEffect.mockRejectedValue(new Error('effect failed'));

        await expect(dispatch(toggleScreensharing(true, true))).resolves.toBeUndefined();

        expect(desktopAudioTrack.dispose).toHaveBeenCalled();
        expect(ofType('SCREENSHARE_AUDIO_TRACK').at(-1)).toEqual({ track: null, type: 'SCREENSHARE_AUDIO_TRACK' });
        expect(ofType('SCREEN_AUDIO_SHARE_STATE')).toHaveLength(0);
        expect(ofType('ERROR_NOTIFICATION')).toEqual([
            { props: { titleKey: 'notify.screenShareNoAudioTitle' }, type: 'ERROR_NOTIFICATION' }
        ]);
    });

    it('goes on with a screen share whose audio could not be added to the conference', async () => {
        state.localAudio = undefined;
        state.conference.replaceTrack.mockRejectedValue(new Error('replace failed'));

        await expect(dispatch(toggleScreensharing(true))).resolves.toBeUndefined();

        expect(ofType('ADD_LOCAL_TRACK')).toEqual([ { track: desktopVideoTrack, type: 'ADD_LOCAL_TRACK' } ]);
        expect(desktopAudioTrack.dispose).toHaveBeenCalled();
        expect(desktopVideoTrack.dispose).not.toHaveBeenCalled();
        expect(ofType('SCREENSHARE_AUDIO_TRACK').at(-1)).toEqual({ track: null, type: 'SCREENSHARE_AUDIO_TRACK' });
        expect(ofType('ERROR_NOTIFICATION')).toHaveLength(1);
        expect(notifyScreenSharingStatusChanged).toHaveBeenCalledWith(true, { sourceType: 'screen' });
    });
});

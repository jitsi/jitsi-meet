// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAudioTestDevices, shouldShowAudioTestOnPrejoin } from './functions.web';

const mocks = vi.hoisted(() => {
    return {
        iAmVisitor: vi.fn(),
        isMobileBrowser: vi.fn()
    };
});

// Keep the import graph away from i18n, which needs a browser.
vi.mock('../base/devices/actions.web', () => ({}));
vi.mock('../base/devices/functions.web', () => ({ getAudioOutputDeviceId: () => 'default' }));
vi.mock('../base/environment/utils', () => {
    return {
        isIosMobileBrowser: () => false,
        isMobileBrowser: mocks.isMobileBrowser
    };
});
vi.mock('../base/lib-jitsi-meet', () => {
    return {
        default: {
            isCollectingLocalStats: () => true,
            mediaDevices: {
                isDeviceChangeAvailable: () => true,
                isMultipleAudioInputSupported: () => true
            }
        }
    };
});
vi.mock('../base/settings/functions.web', () => ({ getUserSelectedMicDeviceId: () => undefined }));
vi.mock('../base/tracks/functions.any', () => ({}));
vi.mock('../noise-suppression/functions', () => ({ isNoiseSuppressionEnabled: () => false }));
vi.mock('../prejoin/functions', () => ({ isPrejoinPageVisible: () => true }));
vi.mock('../visitors/functions', () => ({ iAmVisitor: mocks.iAmVisitor }));

// The group id identifies the physical device that an input or output is part of.
const device = (kind: MediaDeviceKind, deviceId: string, groupId: string) => {
    return {
        deviceId,
        groupId,
        kind,
        label: deviceId
    } as MediaDeviceInfo;
};

const builtInMic = device('audioinput', 'built-in-mic', 'built-in');
const builtInSpeakers = device('audiooutput', 'built-in-speakers', 'built-in');
const headsetMic = device('audioinput', 'headset-mic', 'headset');
const headsetSpeakers = device('audiooutput', 'headset-speakers', 'headset');
const monitorSpeakers = device('audiooutput', 'monitor-speakers', 'monitor');
const webcamMic = device('audioinput', 'webcam-mic', 'webcam');

describe('getAudioTestDevices', () => {
    it('uses the OS defaults when they are the same device', () => {
        expect(getAudioTestDevices({
            audioInput: [ device('audioinput', 'default', 'headset'), builtInMic, headsetMic ],
            audioOutput: [ device('audiooutput', 'default', 'headset'), builtInSpeakers, headsetSpeakers ]
        })).toEqual({
            micId: 'default',
            speakerId: 'default'
        });
    });

    it('uses the speakers of the default microphone\'s device', () => {
        expect(getAudioTestDevices({
            audioInput: [ device('audioinput', 'default', 'headset'), builtInMic, headsetMic ],
            audioOutput: [ device('audiooutput', 'default', 'built-in'), builtInSpeakers, headsetSpeakers ]
        })).toEqual({
            micId: 'default',
            speakerId: 'headset-speakers'
        });
    });

    it('uses the default speakers when the microphone\'s device has none', () => {
        expect(getAudioTestDevices({
            audioInput: [ device('audioinput', 'default', 'webcam'), builtInMic, webcamMic ],
            audioOutput: [ device('audiooutput', 'default', 'monitor'), builtInSpeakers, monitorSpeakers ]
        })).toEqual({
            micId: 'default',
            speakerId: 'default'
        });
    });

    it('skips the communications device when pairing', () => {
        expect(getAudioTestDevices({
            audioInput: [ device('audioinput', 'default', 'headset'), headsetMic ],
            audioOutput: [
                device('audiooutput', 'default', 'built-in'),
                device('audiooutput', 'communications', 'headset'),
                builtInSpeakers,
                headsetSpeakers
            ]
        })).toEqual({
            micId: 'default',
            speakerId: 'headset-speakers'
        });
    });

    it('uses the first devices listed where the browser has no default entries', () => {
        expect(getAudioTestDevices({
            audioInput: [ builtInMic, headsetMic ],
            audioOutput: [ monitorSpeakers, builtInSpeakers, headsetSpeakers ]
        })).toEqual({
            micId: 'built-in-mic',
            speakerId: 'built-in-speakers'
        });
    });

    it('doesn\'t pair devices without a group id', () => {
        expect(getAudioTestDevices({
            audioInput: [ device('audioinput', 'mic', '') ],
            audioOutput: [ device('audiooutput', 'speakers', ''), device('audiooutput', 'other', '') ]
        })).toEqual({
            micId: 'mic',
            speakerId: 'speakers'
        });
    });

    it('has no speakers where the browser lists none', () => {
        expect(getAudioTestDevices({
            audioInput: [ builtInMic ]
        })).toEqual({
            micId: 'built-in-mic',
            speakerId: undefined
        });
    });
});

describe('shouldShowAudioTestOnPrejoin', () => {
    let state: any;

    beforeEach(() => {
        mocks.iAmVisitor.mockReturnValue(false);
        mocks.isMobileBrowser.mockReturnValue(false);
        vi.stubGlobal('MediaRecorder', class {});
        state = {
            'features/base/config': {},
            'features/base/devices': { permissions: { audio: true } },
            'features/base/settings': {},
            'features/settings': { audioSettings: {} }
        };
    });

    it('offers the test by default when the user hasn\'t gone through it', () => {
        expect(shouldShowAudioTestOnPrejoin(state)).toBe(true);
    });

    it.each([
        [ 'it is turned off', () => {
            state['features/base/config'].prejoinConfig = { showAudioTest: false };
        } ],
        [ 'the user went through it or skipped it', () => {
            state['features/base/settings'].audioTestDone = true;
        } ],
        [ 'there is no access to the microphone', () => {
            state['features/base/devices'].permissions.audio = false;
        } ],
        [ 'the user is a visitor', () => mocks.iAmVisitor.mockReturnValue(true) ],
        [ 'it is a mobile browser', () => mocks.isMobileBrowser.mockReturnValue(true) ],
        [ 'the browser can\'t record', () => vi.stubGlobal('MediaRecorder', undefined) ]
    ])('doesn\'t offer the test when %s', (_, setUp) => {
        setUp();

        expect(shouldShowAudioTestOnPrejoin(state)).toBe(false);
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import AbstractStartRecordingDialog, { IProps } from './AbstractStartRecordingDialog';

// Keep the import graph away from i18n, lib-jitsi-meet and the rest of the app, which need a browser.
vi.mock('../../../analytics/AnalyticsEvents', () => ({ createRecordingDialogEvent: () => ({}) }));
vi.mock('../../../analytics/functions', () => ({ sendAnalytics: vi.fn() }));
vi.mock('../../../base/i18n/i18next', () => ({ DEFAULT_LANGUAGE: 'en' }));
vi.mock('../../../base/jwt/constants', () => ({ MEET_FEATURES: {} }));
vi.mock('../../../base/jwt/functions', () => ({ isJwtFeatureEnabled: vi.fn() }));
vi.mock('../../../base/lib-jitsi-meet', () => ({ JitsiRecordingConstants: { mode: { FILE: 'file' } } }));
vi.mock('../../../base/participants/functions', () => ({ isLocalParticipantModerator: vi.fn() }));
vi.mock('../../../dropbox/actions', () => ({ updateDropboxToken: vi.fn() }));
vi.mock('../../../dropbox/functions', () => ({ getNewAccessToken: vi.fn(), isEnabled: vi.fn() }));
vi.mock('../../../dropbox/functions.any', () => ({ getDropboxData: vi.fn() }));
vi.mock('../../../e2ee/functions', () => ({ isE2EEOnInMeeting: vi.fn() }));
vi.mock('../../../follow-me/functions', () => ({ isFollowMeActive: vi.fn(), isFollowMeRecorderActive: vi.fn() }));
vi.mock('../../../jaas/functions', () => ({ isVpaasMeeting: vi.fn() }));
vi.mock('../../../notifications/actions', () => ({ showErrorNotification: vi.fn() }));
vi.mock('../../../subtitles/actions.any', () => ({
    setRequestingSubtitles: (enabled: boolean) => ({ type: 'SET_REQUESTING_SUBTITLES', enabled })
}));
vi.mock('../../../transcribing/functions', () => ({
    canAddTranscriber: vi.fn(),
    isRecorderTranscriptionsRunning: vi.fn(),
    isSubtitlesOnlyTranscriberRunning: vi.fn()
}));
vi.mock('../../actions.any', () => ({
    setSelectedRecordingService: vi.fn(),
    setStartRecordingIntent: (intent: object) => ({ type: 'SET_START_RECORDING_INTENT', intent }),
    setStopRecordingIntent: (intent: object) => ({ type: 'SET_STOP_RECORDING_INTENT', intent }),
    startLocalVideoRecording: vi.fn(),
    stopLocalVideoRecording: vi.fn()
}));
vi.mock('../../constants', () => ({
    RECORDING_METADATA_ID: 'recording',
    RECORDING_TYPES: {
        DROPBOX: 'dropbox',
        JITSI_REC_SERVICE: 'recording-service',
        LOCAL: 'local'
    }
}));

// Neither service is running and nothing blocks starting either of them.
vi.mock('../../functions', () => ({
    getActiveSession: vi.fn(),
    getRecordingDialogModel: () => ({
        footer: {
            showStartBoth: true,
            showStopBoth: false,
            visible: true
        },
        recording: {
            defaultService: 'recording-service',
            running: false,
            selectedService: 'recording-service',
            services: [ 'recording-service' ],
            visible: true
        },
        transcription: {
            running: false,
            visible: true
        }
    }),
    hasRecordingOrTranscriptionFeature: vi.fn(),
    isLiveStreamingRunning: vi.fn(),
    isRecordingRunning: vi.fn(),
    isRecordingSharingEnabled: vi.fn()
}));

describe('AbstractStartRecordingDialog', () => {
    let conference: {
        getMetadataHandler: () => {
            getMetadata: () => object;
            setMetadata: ReturnType<typeof vi.fn>;
        };
        startRecording: ReturnType<typeof vi.fn>;
    };
    let dispatch: ReturnType<typeof vi.fn>;
    let setMetadata: ReturnType<typeof vi.fn>;

    const createDialog = () => new AbstractStartRecordingDialog({
        _appKey: '',
        _canTranscribe: true,
        _conference: conference,
        _e2eeOn: false,
        _fileRecordingsServiceEnabled: true,
        _fileRecordingsServiceSharingEnabled: false,
        _followMeActive: false,
        _followMeRecorderActive: false,
        _followMeRecorderEnabled: false,
        _isDropboxEnabled: false,
        _isLiveStreamRunning: false,
        _isModerator: true,
        _isVpaas: false,
        _localRecordingAvailable: false,
        _rToken: '',
        _recordingFeatureEnabled: true,
        _recordingRunning: false,
        _screensharing: false,
        _screenshotCaptureEnabled: false,
        _subtitlesLanguage: null,
        _subtitlesOnlyTranscriberRunning: false,
        _token: '',
        _transcriptionRunning: false,
        dispatch,
        navigation: undefined
    } as unknown as IProps);

    const dispatchedOfType = (type: string) =>
        dispatch.mock.calls.map(([ action ]) => action).filter(action => action.type === type);

    beforeEach(() => {
        dispatch = vi.fn();
        setMetadata = vi.fn();
        conference = {
            getMetadataHandler: () => {
                return {
                    getMetadata: () => ({}),
                    setMetadata
                };
            },
            startRecording: vi.fn()
        };
    });

    it('starts only the recording when the recording section Start button is pressed', () => {
        expect(createDialog()._onStartRecording()).toBe(true);

        expect(conference.startRecording).toHaveBeenCalledOnce();
        expect(dispatchedOfType('SET_START_RECORDING_INTENT')).toEqual([ {
            type: 'SET_START_RECORDING_INTENT',
            intent: {
                recording: true,
                transcription: false
            }
        } ]);
        expect(dispatchedOfType('SET_REQUESTING_SUBTITLES')).toEqual([]);
        expect(setMetadata).toHaveBeenCalledWith('recording', { isRecordingRequested: true });
    });

    it('starts only the transcription when the transcription section Start button is pressed', () => {
        expect(createDialog()._onStartTranscription()).toBe(true);

        expect(conference.startRecording).not.toHaveBeenCalled();
        expect(dispatchedOfType('SET_START_RECORDING_INTENT')).toEqual([ {
            type: 'SET_START_RECORDING_INTENT',
            intent: {
                recording: false,
                transcription: true
            }
        } ]);
        expect(dispatchedOfType('SET_REQUESTING_SUBTITLES')).toEqual([ {
            type: 'SET_REQUESTING_SUBTITLES',
            enabled: true
        } ]);
    });

    it('starts both the recording and the transcription when Start both is pressed', () => {
        expect(createDialog()._onStartBoth()).toBe(true);

        expect(conference.startRecording).toHaveBeenCalledOnce();
        expect(dispatchedOfType('SET_START_RECORDING_INTENT')).toEqual([ {
            type: 'SET_START_RECORDING_INTENT',
            intent: {
                recording: true,
                transcription: true
            }
        } ]);
        expect(dispatchedOfType('SET_REQUESTING_SUBTITLES')).toEqual([ {
            type: 'SET_REQUESTING_SUBTITLES',
            enabled: true
        } ]);
    });
});

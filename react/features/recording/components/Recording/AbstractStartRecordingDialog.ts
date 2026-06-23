import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createRecordingDialogEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import { IJitsiConference } from '../../../base/conference/reducer';
import { MEET_FEATURES } from '../../../base/jwt/constants';
import { isJwtFeatureEnabled } from '../../../base/jwt/functions';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { updateDropboxToken } from '../../../dropbox/actions';
import { getDropboxData, getNewAccessToken, isEnabled as isDropboxEnabled } from '../../../dropbox/functions.any';
import { showErrorNotification } from '../../../notifications/actions';
import { setRequestingSubtitles } from '../../../subtitles/actions.any';
import { isRecorderTranscriptionsRunning } from '../../../transcribing/functions';
import {
    setSelectedRecordingService,
    setStartRecordingIntent,
    setStopRecordingIntent,
    startLocalVideoRecording,
    stopLocalVideoRecording
} from '../../actions';
import { RECORDING_METADATA_ID, RECORDING_TYPES } from '../../constants';
import {
    getActiveSession,
    hasRecordingOrTranscriptionFeature,
    isRecordingRunning,
    isRecordingSharingEnabled,
    shouldAutoTranscribeOnRecord,
    supportsLocalRecording
} from '../../functions';
import { ISessionData } from '../../reducer';


export interface IProps extends WithTranslation {

    /**
     * The app key for the dropbox authentication.
     */
    _appKey: string;

    /**
     * Requests transcribing when recording is turned on.
     */
    _autoTranscribeOnRecord: boolean;

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference?: IJitsiConference;

    /**
     * Whether subtitles should be displayed or not.
     */
    _displaySubtitles?: boolean;

    /**
     * Active FILE recording session, needed to stop recording.
     */
    _fileRecordingSession?: ISessionData;

    /**
     * Whether to show file recordings service, even if integrations
     * are enabled.
     */
    _fileRecordingsServiceEnabled: boolean;

    /**
     * Whether to show the possibility to share file recording with other people (e.g. Meeting participants), based on
     * the actual implementation on the backend.
     */
    _fileRecordingsServiceSharingEnabled: boolean;

    /**
     * If true the dropbox integration is enabled, otherwise - disabled.
     */
    _isDropboxEnabled: boolean;

    /**
     * Whether the local participant is a moderator.
     */
    _isModerator: boolean;

    /**
     * Whether a local recording is currently active.
     */
    _localRecording?: boolean;

    /**
     * Whether or not local recording is enabled.
     */
    _localRecordingEnabled: boolean;

    /**
     * The dropbox refresh token.
     */
    _rToken: string;

    /**
     * Whether file recording is currently running.
     */
    _recordingRunning?: boolean;

    /**
     * Whether or not the local participant is screensharing.
     */
    _screensharing: boolean;

    /**
     * Whether or not the screenshot capture feature is enabled.
     */
    _screenshotCaptureEnabled: boolean;

    /**
     * The selected language for subtitles.
     */
    _subtitlesLanguage: string | null;

    /**
     * The dropbox access token.
     */
    _token: string;

    /**
     * Access token's expiration date as UNIX timestamp.
     */
    _tokenExpireDate?: number;

    /**
     * Whether transcription is currently running.
     */
    _transcriptionRunning?: boolean;

    /**
     * The redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether to pre-select recording when the dialog opens.
     * Takes precedence over the running recording state when set.
     */
    initialRecording?: boolean;

    /**
     * Whether to pre-select transcription when the dialog opens.
     * Overrides _autoTranscribeOnRecord when provided.
     */
    initialTranscription?: boolean;

    navigation: any;

    /**
     * Pre-selects the audio/video recording toggle when no session is active.
     * Used by the nudge flow to open the dialog with recording already checked.
     */
    recordAudioAndVideo?: boolean;
}

interface IState {

    /**
     * <tt>true</tt> if we have valid oauth token.
     */
    isTokenValid: boolean;

    /**
     * <tt>true</tt> if we are in process of validating the oauth token.
     */
    isValidating: boolean;

    /**
     * Whether the local recording should record just the local user streams.
     */
    localRecordingOnlySelf: boolean;

    /**
     * The currently selected recording service of type: RECORDING_TYPES.
     */
    selectedRecordingService: string;

    /**
     * True if the user requested the service to share the recording with others.
     */
    sharingEnabled: boolean;

    /**
     * True if the user requested the service to record audio and video.
     */
    shouldRecordAudioAndVideo: boolean;

    /**
     * True if the user requested the service to record transcription.
     */
    shouldRecordTranscription: boolean;

    /**
     * Number of MiB of available space in user's Dropbox account.
     */
    spaceLeft?: number;

    /**
     * The display name of the user's Dropbox account.
     */
    userName?: string;
}

/**
 * Component for the recording start dialog.
 */
class AbstractStartRecordingDialog extends Component<IProps, IState> {
    /**
     * Initializes a new {@code StartRecordingDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSubmit = this._onSubmit.bind(this);
        this._onSelectedRecordingServiceChanged
            = this._onSelectedRecordingServiceChanged.bind(this);
        this._onSharingSettingChanged = this._onSharingSettingChanged.bind(this);
        this._toggleScreenshotCapture = this._toggleScreenshotCapture.bind(this);
        this._onLocalRecordingSelfChange = this._onLocalRecordingSelfChange.bind(this);
        this._onTranscriptionChange = this._onTranscriptionChange.bind(this);
        this._onRecordAudioAndVideoChange = this._onRecordAudioAndVideoChange.bind(this);

        let selectedRecordingService = '';

        if (this.props._fileRecordingsServiceEnabled) {
            selectedRecordingService = RECORDING_TYPES.JITSI_REC_SERVICE;
        } else if (this._areIntegrationsEnabled()) {
            if (props._localRecordingEnabled && supportsLocalRecording()) {
                selectedRecordingService = RECORDING_TYPES.LOCAL;
            } else {
                selectedRecordingService = RECORDING_TYPES.DROPBOX;
            }
        } else if (props._localRecordingEnabled && supportsLocalRecording()) {
            selectedRecordingService = RECORDING_TYPES.LOCAL;
        }
        // If no service is available, selectedRecordingService stays '' and
        // the Start Recording button will be disabled.

        const recordingRunning = props._recordingRunning ?? false;
        const transcriptionRunning = props._transcriptionRunning ?? false;
        const hasActiveSession = recordingRunning || transcriptionRunning;

        this.state = {
            isTokenValid: false,
            isValidating: false,
            userName: undefined,
            sharingEnabled: true,
            // When a session is active derive initial toggles from running state.
            // Explicit props (nudge flow) take priority.
            shouldRecordAudioAndVideo: hasActiveSession
                ? (props.initialRecording ?? recordingRunning)
                : (props.recordAudioAndVideo ?? false),
            shouldRecordTranscription: hasActiveSession
                ? (props.initialTranscription ?? transcriptionRunning)
                : (props.initialTranscription ?? props._autoTranscribeOnRecord ?? false),
            spaceLeft: undefined,
            selectedRecordingService,
            localRecordingOnlySelf: false
        };
    }

    /**
     * Validates the oauth access token.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        if (typeof this.props._token !== 'undefined') {
            this._onTokenUpdated();
        }
    }

    /**
     * Validates the oauth access token.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidUpdate(prevProps: IProps) {
        if (this.props._token !== prevProps._token) {
            this._onTokenUpdated();
        }
    }

    /**
     * Returns true if the integrations with third party services are enabled
     * and false otherwise.
     *
     * @returns {boolean} - True if the integrations with third party services
     * are enabled and false otherwise.
     */
    _areIntegrationsEnabled() {
        return this.props._isDropboxEnabled
            && !this.props._recordingRunning
            && !this.props._transcriptionRunning;
    }

    /**
     * Callback to handle sharing setting change from the dialog.
     *
     * @returns {void}
     */
    _onSharingSettingChanged() {
        this.setState({
            sharingEnabled: !this.state.sharingEnabled
        });
    }

    /**
     * Callback to handle local recording only self setting change.
     *
     * @returns {void}
     */
    _onLocalRecordingSelfChange() {
        this.setState({
            localRecordingOnlySelf: !this.state.localRecordingOnlySelf
        });
    }

    /**
     * Handles selected recording service changes.
     *
     * @param {string} selectedRecordingService - The new selected recording
     * service.
     * @returns {void}
     */
    _onSelectedRecordingServiceChanged(selectedRecordingService: string) {
        this.setState({ selectedRecordingService }, () => {
            this.props.dispatch(setSelectedRecordingService(selectedRecordingService));
        });
    }

    /**
     * Handles transcription switch change.
     *
     * @param {boolean} value - The new value.
     * @returns {void}
     */
    _onTranscriptionChange(value: boolean) {
        this.setState({
            shouldRecordTranscription: value
        });
    }

    /**
     * Handles audio and video switch change.
     *
     * @param {boolean} value - The new value.
     * @returns {void}
     */
    _onRecordAudioAndVideoChange(value: boolean) {
        this.setState({
            shouldRecordAudioAndVideo: value
        });
    }

    /**
     * Validates the dropbox access token and fetches account information.
     *
     * @returns {void}
     */
    _onTokenUpdated() {
        const { _appKey, _isDropboxEnabled, _token, _rToken, _tokenExpireDate, dispatch } = this.props;

        if (!_isDropboxEnabled) {
            return;
        }

        if (typeof _token === 'undefined') {
            this.setState({
                isTokenValid: false,
                isValidating: false
            });
        } else { // @ts-ignore
            if (_tokenExpireDate && Date.now() > new Date(_tokenExpireDate)) {
                getNewAccessToken(_appKey, _rToken)
                    .then((resp: { expireDate: number; rToken: string; token: string; }) =>
                        dispatch(updateDropboxToken(resp.token, resp.rToken, resp.expireDate)));

                return;
            }

            this.setState({
                isTokenValid: false,
                isValidating: true
            });
            getDropboxData(_token, _appKey).then(data => {
                if (typeof data === 'undefined') {
                    this.setState({
                        isTokenValid: false,
                        isValidating: false
                    });
                } else {
                    this.setState({
                        isTokenValid: true,
                        isValidating: false,
                        ...data
                    });
                }
            });
        }
    }

    /**
     * Returns true when the current toggle selection differs from what is
     * already running — i.e. there is something to apply.
     *
     * @returns {boolean}
     */
    _isChanged() {
        const { _recordingRunning = false, _transcriptionRunning = false } = this.props;

        return this.state.shouldRecordAudioAndVideo !== _recordingRunning
            || this.state.shouldRecordTranscription !== _transcriptionRunning;
    }

    /**
     * Applies recording/transcription changes by computing the delta between
     * the current running state and the user's selection, then starting or
     * stopping each service accordingly.
     *
     * @returns {boolean|undefined} - True to close the dialog, undefined to
     *   keep it open (e.g. on validation failure).
     */
    _onSubmit() {
        const {
            _appKey,
            _conference,
            _displaySubtitles,
            _fileRecordingSession,
            _isDropboxEnabled,
            _localRecording,
            _recordingRunning = false,
            _rToken,
            _subtitlesLanguage,
            _token,
            _transcriptionRunning = false,
            dispatch
        } = this.props;

        const {
            localRecordingOnlySelf,
            selectedRecordingService,
            sharingEnabled,
            shouldRecordAudioAndVideo,
            shouldRecordTranscription
        } = this.state;

        const startRecording = !_recordingRunning && shouldRecordAudioAndVideo;
        const stopRecording = _recordingRunning && !shouldRecordAudioAndVideo;
        const startTranscription = !_transcriptionRunning && shouldRecordTranscription;
        const stopTranscription = _transcriptionRunning && !shouldRecordTranscription;

        // Pre-seed intents synchronously — must happen before any async operations
        // so the sound/notification coordinator knows what to wait for.
        if (startRecording || startTranscription) {
            dispatch(setStartRecordingIntent({
                recording: startRecording,
                transcription: startTranscription
            }));
        }
        if ((stopRecording || stopTranscription) && !_localRecording) {
            dispatch(setStopRecordingIntent({
                recording: stopRecording && Boolean(_fileRecordingSession),
                transcription: stopTranscription
            }));
        }

        // === Stop recording ===
        if (stopRecording) {
            sendAnalytics(createRecordingDialogEvent('stop', 'confirm.button'));
            if (_localRecording) {
                dispatch(stopLocalVideoRecording());
            } else if (_fileRecordingSession) {
                _conference?.stopRecording(_fileRecordingSession.id);
                this._toggleScreenshotCapture();
                // Keep isTranscribingEnabled in the metadata if transcription is still running,
                // so the metadata listener does not see a false transition on that field.
                _conference?.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
                    isRecordingRequested: false,
                    ...(_transcriptionRunning && !stopTranscription && { isTranscribingEnabled: true })
                });
            }
        }

        // === Stop transcription ===
        if (stopTranscription) {
            const recordingStillRunning = _recordingRunning && !stopRecording;

            // When recording is still running, skip the subtitles-internal metadata write and do
            // a single write ourselves. This prevents two consecutive metadata transitions
            // (false→false on isRecordingRequested, then false→true) from firing spurious
            // "recording stopped" and "recording started" sounds and notifications.
            // Spread existing recording metadata so we only change isTranscribingEnabled —
            // hardcoding isRecordingRequested: true would cause a spurious recordingStarting
            // transition if that field was not previously set in the server metadata.
            dispatch(setRequestingSubtitles(false, _displaySubtitles, _subtitlesLanguage, true, false, recordingStillRunning));
            if (recordingStillRunning) {
                const existingRecMeta = _conference?.getMetadataHandler()?.getMetadata()[RECORDING_METADATA_ID] ?? {};

                _conference?.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
                    ...existingRecMeta,
                    isTranscribingEnabled: false
                });
            }
        }

        // === Start recording ===
        if (startRecording) {
            let appData;
            const attributes: { type?: string; } = {};

            switch (selectedRecordingService) {
            case RECORDING_TYPES.DROPBOX: {
                if (_isDropboxEnabled && _token) {
                    appData = JSON.stringify({
                        'file_recording_metadata': {
                            'upload_credentials': {
                                'service_name': RECORDING_TYPES.DROPBOX,
                                'token': _token,
                                'r_token': _rToken,
                                'app_key': _appKey
                            }
                        }
                    });
                    attributes.type = RECORDING_TYPES.DROPBOX;
                } else {
                    dispatch(showErrorNotification({ titleKey: 'dialog.noDropboxToken' }));

                    return;
                }
                break;
            }
            case RECORDING_TYPES.JITSI_REC_SERVICE: {
                appData = JSON.stringify({
                    'file_recording_metadata': {
                        'share': sharingEnabled
                    }
                });
                attributes.type = RECORDING_TYPES.JITSI_REC_SERVICE;
                break;
            }
            case RECORDING_TYPES.LOCAL: {
                dispatch(startLocalVideoRecording(localRecordingOnlySelf));
                _conference?.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
                    isTranscribingEnabled: shouldRecordTranscription
                });

                return true;
            }
            }

            sendAnalytics(createRecordingDialogEvent('start', 'confirm.button', attributes));
            this._toggleScreenshotCapture();
            _conference?.startRecording({
                mode: JitsiRecordingConstants.mode.FILE,
                appData
            });
        }

        // === Handle transcription start ===
        // JITSI_REC_SERVICE uses setRequestingSubtitles; other services update metadata directly.
        if (startTranscription) {
            if (selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE) {
                dispatch(setRequestingSubtitles(
                    true, _displaySubtitles, _subtitlesLanguage, true, startRecording || _recordingRunning));
            } else {
                _conference?.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
                    isTranscribingEnabled: true
                });
            }
        } else if (startRecording && shouldRecordTranscription
                && selectedRecordingService !== RECORDING_TYPES.JITSI_REC_SERVICE) {
            // Starting recording with transcription already on — ensure metadata is consistent.
            _conference?.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
                isRecordingRequested: true,
                isTranscribingEnabled: true
            });
        }

        return true;
    }

    /**
     * Toggles screenshot capture feature.
     *
     * @returns {void}
     */
    _toggleScreenshotCapture() {
        // To be implemented by subclass.
    }

    /**
     * Renders the platform specific dialog content.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderDialogContent: () => React.Component;
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code StartRecordingDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @param {any} _ownProps - Component's own props.
 * @private
 * @returns {IProps}
 */
export function mapStateToProps(state: IReduxState, _ownProps: any) {
    const {
        recordingService,
        dropbox = { appKey: undefined },
        localRecording,
        recordings = { recordAudioAndVideo: true }
    } = state['features/base/config'];
    const {
        _displaySubtitles,
        _language: _subtitlesLanguage
    } = state['features/subtitles'];

    // Only treat cloud recordings as "running" for users who can actually control them.
    // Non-mods without the recording/transcription JWT feature cannot stop cloud sessions,
    // so from their perspective only their own local recording counts as "running".
    const canControlCloud = isLocalParticipantModerator(state)
        || hasRecordingOrTranscriptionFeature(state);

    return {
        _appKey: dropbox.appKey ?? '',
        _autoTranscribeOnRecord: shouldAutoTranscribeOnRecord(state),
        _conference: state['features/base/conference'].conference,
        _displaySubtitles,
        _fileRecordingSession: getActiveSession(state, JitsiRecordingConstants.mode.FILE),
        _fileRecordingsServiceEnabled: recordingService?.enabled ?? false,
        _fileRecordingsServiceSharingEnabled: isRecordingSharingEnabled(state),
        _isModerator: isLocalParticipantModerator(state),
        _isDropboxEnabled: isDropboxEnabled(state),
        _localRecording: Boolean(state['features/recording'].localRecordingRunning),
        _localRecordingEnabled: !localRecording?.disable,
        _recordingRunning: canControlCloud
            ? isRecordingRunning(state)
            : Boolean(state['features/recording'].localRecordingRunning),
        _rToken: state['features/dropbox'].rToken ?? '',
        _transcriptionRunning: canControlCloud
            ? isRecorderTranscriptionsRunning(state)
            : false,
        recordAudioAndVideo:
            isJwtFeatureEnabled(state, MEET_FEATURES.RECORDING, false)
                ? _ownProps.recordAudioAndVideo ?? recordings?.recordAudioAndVideo ?? true : false,
        _subtitlesLanguage,
        _tokenExpireDate: state['features/dropbox'].expireDate,
        _token: state['features/dropbox'].token ?? ''
    };
}

export default AbstractStartRecordingDialog;

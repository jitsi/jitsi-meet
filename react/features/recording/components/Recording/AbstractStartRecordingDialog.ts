import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createRecordingDialogEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import { IJitsiConference } from '../../../base/conference/reducer';
import { DEFAULT_LANGUAGE } from '../../../base/i18n/i18next';
import { MEET_FEATURES } from '../../../base/jwt/constants';
import { isJwtFeatureEnabled } from '../../../base/jwt/functions';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { updateDropboxToken } from '../../../dropbox/actions';
import { getNewAccessToken, isEnabled as isDropboxEnabled } from '../../../dropbox/functions';
import { getDropboxData } from '../../../dropbox/functions.any';
import { showErrorNotification } from '../../../notifications/actions';
import { setRequestingSubtitles } from '../../../subtitles/actions.any';
import { canAddTranscriber, isRecorderTranscriptionsRunning } from '../../../transcribing/functions';
import {
    setSelectedRecordingService,
    setStartRecordingIntent,
    setStopRecordingIntent,
    startLocalVideoRecording,
    stopLocalVideoRecording
} from '../../actions.any';
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

/**
 * The set of start/stop operations to apply on the running services. Each
 * operation is applied only when its flag is true.
 */
interface IRecordingChanges {
    startRecording?: boolean;
    startTranscription?: boolean;
    stopRecording?: boolean;
    stopTranscription?: boolean;
}

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
     * Whether the local participant can start/stop transcription.
     */
    _canTranscribe: boolean;

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

    navigation: any;

    /**
     * When false, the recording section is collapsed on open, putting the
     * focus on the transcription section (e.g. subtitles/nudge flows).
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
     * The language ("translation-languages:" prefixed) the transcription will
     * be saved in.
     */
    selectedLanguage: string | null;

    /**
     * The currently selected recording service of type: RECORDING_TYPES.
     */
    selectedRecordingService: string;

    /**
     * True if the user requested the service to share the recording with others.
     */
    sharingEnabled: boolean;

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
 * Component for the recording & transcription dialog. Exposes independent
 * start/stop handlers for each service plus combined "both" handlers; each
 * handler applies its changes immediately.
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
        this._onSelectedRecordingServiceChanged
            = this._onSelectedRecordingServiceChanged.bind(this);
        this._onSharingSettingChanged = this._onSharingSettingChanged.bind(this);
        this._toggleScreenshotCapture = this._toggleScreenshotCapture.bind(this);
        this._onLocalRecordingSelfChange = this._onLocalRecordingSelfChange.bind(this);
        this._onSubtitlesLanguageChanged = this._onSubtitlesLanguageChanged.bind(this);
        this._onStartRecording = this._onStartRecording.bind(this);
        this._onStopRecording = this._onStopRecording.bind(this);
        this._onStartTranscription = this._onStartTranscription.bind(this);
        this._onStopTranscription = this._onStopTranscription.bind(this);
        this._onStartBoth = this._onStartBoth.bind(this);
        this._onStopBoth = this._onStopBoth.bind(this);
        this._onStartRecordingPress = this._onStartRecordingPress.bind(this);
        this._onStopRecordingPress = this._onStopRecordingPress.bind(this);
        this._onStartTranscriptionPress = this._onStartTranscriptionPress.bind(this);
        this._onStopTranscriptionPress = this._onStopTranscriptionPress.bind(this);
        this._onStartBothPress = this._onStartBothPress.bind(this);
        this._onStopBothPress = this._onStopBothPress.bind(this);

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
        // the start recording button will be disabled.

        this.state = {
            isTokenValid: false,
            isValidating: false,
            userName: undefined,
            sharingEnabled: true,
            selectedLanguage: props._subtitlesLanguage
                ?? `translation-languages:${DEFAULT_LANGUAGE}`,
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
     * Handles transcription language changes.
     *
     * @param {string} selectedLanguage - The new ("translation-languages:"
     * prefixed) language.
     * @returns {void}
     */
    _onSubtitlesLanguageChanged(selectedLanguage: string) {
        this.setState({ selectedLanguage });
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
     * Returns true when the start recording button should be disabled: either
     * no recording service is available or the selected one is not ready to
     * be used (e.g. Dropbox without a valid sign-in).
     *
     * @returns {boolean}
     */
    _isStartRecordingDisabled() {
        const { isTokenValid, selectedRecordingService } = this.state;

        if (selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE
                || selectedRecordingService === RECORDING_TYPES.LOCAL) {
            return false;
        }
        if (selectedRecordingService === RECORDING_TYPES.DROPBOX) {
            return !isTokenValid;
        }

        return true;
    }

    /**
     * Starts the audio & video recording. When the deployment is configured
     * with {@code transcription.autoTranscribeOnRecord} the transcription is
     * started along with it.
     *
     * @returns {boolean} - True when the action was applied.
     */
    _onStartRecording() {
        const { _autoTranscribeOnRecord, _canTranscribe, _transcriptionRunning } = this.props;

        return this._applyChanges({
            startRecording: true,
            startTranscription: _autoTranscribeOnRecord && _canTranscribe && !_transcriptionRunning
        });
    }

    /**
     * Stops the audio & video recording, leaving a running transcription
     * untouched.
     *
     * @returns {boolean} - True when the action was applied.
     */
    _onStopRecording() {
        return this._applyChanges({ stopRecording: true });
    }

    /**
     * Starts the transcription, leaving the recording state untouched.
     *
     * @returns {boolean} - True when the action was applied.
     */
    _onStartTranscription() {
        return this._applyChanges({ startTranscription: true });
    }

    /**
     * Stops the transcription, leaving a running recording untouched.
     *
     * @returns {boolean} - True when the action was applied.
     */
    _onStopTranscription() {
        return this._applyChanges({ stopTranscription: true });
    }

    /**
     * Starts every service which is not running yet.
     *
     * @returns {boolean} - True when the action was applied.
     */
    _onStartBoth() {
        const { _recordingRunning, _transcriptionRunning } = this.props;

        return this._applyChanges({
            startRecording: !_recordingRunning,
            startTranscription: !_transcriptionRunning
        });
    }

    /**
     * Stops every running service.
     *
     * @returns {boolean} - True when the action was applied.
     */
    _onStopBoth() {
        const { _recordingRunning, _transcriptionRunning } = this.props;

        return this._applyChanges({
            stopRecording: _recordingRunning,
            stopTranscription: _transcriptionRunning
        });
    }

    /**
     * Applies the requested recording/transcription changes by starting or
     * stopping each service accordingly.
     *
     * @param {IRecordingChanges} changes - Which services to start/stop.
     * @returns {boolean} - True when the changes were applied, false when the
     * action could not be performed (e.g. validation failure).
     */
    _applyChanges({
        startRecording = false,
        startTranscription = false,
        stopRecording = false,
        stopTranscription = false
    }: IRecordingChanges) {
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
            selectedLanguage,
            selectedRecordingService,
            sharingEnabled
        } = this.state;

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

                    return false;
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
                    isTranscribingEnabled:
                        startTranscription || (_transcriptionRunning && !stopTranscription)
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
                    true, _displaySubtitles, selectedLanguage, true, startRecording || _recordingRunning));
            } else {
                // Spread the existing metadata so that starting transcription while a non-Jitsi
                // recording is already running does not drop isRecordingRequested — that would
                // read as recording having stopped to the metadata listener (see the stopRecording
                // and stopTranscription branches above, which spread for the same reason).
                const existingRecMeta = _conference?.getMetadataHandler()?.getMetadata()[RECORDING_METADATA_ID] ?? {};

                _conference?.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
                    ...existingRecMeta,
                    ...(startRecording && { isRecordingRequested: true }),
                    isTranscribingEnabled: true
                });
            }
        } else if (startRecording) {
            // Recording started without a transcription change: announce it in room metadata so the
            // other participants get the recording start notification/sound (this is what the
            // metadata listener turns into the remote notification). Preserve any existing
            // isTranscribingEnabled so a running transcription is not signalled as stopped.
            const existingRecMeta = _conference?.getMetadataHandler()?.getMetadata()[RECORDING_METADATA_ID] ?? {};

            _conference?.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
                ...existingRecMeta,
                isRecordingRequested: true
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
     * Dismisses the dialog/screen once an action from the list below has been applied.
     *
     * @returns {void}
     */
    _dismiss() {
        // To be implemented by subclass.
    }

    /**
     * Starts the recording and dismisses the dialog/screen.
     *
     * @returns {void}
     */
    _onStartRecordingPress() {
        this._onStartRecording() && this._dismiss();
    }

    /**
     * Stops the recording and dismisses the dialog/screen.
     *
     * @returns {void}
     */
    _onStopRecordingPress() {
        this._onStopRecording() && this._dismiss();
    }

    /**
     * Starts the transcription and dismisses the dialog/screen.
     *
     * @returns {void}
     */
    _onStartTranscriptionPress() {
        this._onStartTranscription() && this._dismiss();
    }

    /**
     * Stops the transcription and dismisses the dialog/screen.
     *
     * @returns {void}
     */
    _onStopTranscriptionPress() {
        this._onStopTranscription() && this._dismiss();
    }

    /**
     * Starts every service which is not running yet and dismisses the dialog/screen.
     *
     * @returns {void}
     */
    _onStartBothPress() {
        this._onStartBoth() && this._dismiss();
    }

    /**
     * Stops every running service and dismisses the dialog/screen.
     *
     * @returns {void}
     */
    _onStopBothPress() {
        this._onStopBoth() && this._dismiss();
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
    const canManageRecordingOrTranscription = isLocalParticipantModerator(state)
        || hasRecordingOrTranscriptionFeature(state);

    return {
        _appKey: dropbox.appKey ?? '',
        _autoTranscribeOnRecord: shouldAutoTranscribeOnRecord(state),
        _canTranscribe: canAddTranscriber(state),
        _conference: state['features/base/conference'].conference,
        _displaySubtitles,
        _fileRecordingSession: getActiveSession(state, JitsiRecordingConstants.mode.FILE),
        _fileRecordingsServiceEnabled: recordingService?.enabled ?? false,
        _fileRecordingsServiceSharingEnabled: isRecordingSharingEnabled(state),
        _isModerator: isLocalParticipantModerator(state),
        _isDropboxEnabled: isDropboxEnabled(state),
        _localRecording: Boolean(state['features/recording'].localRecordingRunning),
        _localRecordingEnabled: !localRecording?.disable,
        _recordingRunning: canManageRecordingOrTranscription
            ? isRecordingRunning(state)
            : Boolean(state['features/recording'].localRecordingRunning),
        _rToken: state['features/dropbox'].rToken ?? '',
        _transcriptionRunning: canManageRecordingOrTranscription
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

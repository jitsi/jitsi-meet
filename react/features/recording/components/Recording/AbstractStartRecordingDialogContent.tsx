import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createRecordingDialogEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import ColorSchemeRegistry from '../../../base/color-scheme/ColorSchemeRegistry';
import { _abstractMapStateToProps } from '../../../base/dialog/functions';
import { MEET_FEATURES } from '../../../base/jwt/constants';
import { isJwtFeatureEnabled } from '../../../base/jwt/functions';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { authorizeDropbox, updateDropboxToken } from '../../../dropbox/actions';
import { setFollowMeRecorderExclusive } from '../../../follow-me/actions';
import { isFollowMeActive, isFollowMeRecorderActive } from '../../../follow-me/functions';
import { isVpaasMeeting } from '../../../jaas/functions';
import { getAvailableSubtitlesLanguages } from '../../../subtitles/functions.any';
import { canAddTranscriber, isRecorderTranscriptionsRunning } from '../../../transcribing/functions';
import { RECORDING_TYPES } from '../../constants';
import { hasRecordingOrTranscriptionFeature, isLiveStreamingRunning, supportsLocalRecording } from '../../functions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractStartRecordingDialogContent}.
 */
export interface IProps extends WithTranslation {

    /**
     * The available ("translation-languages:" prefixed) transcription
     * languages.
     */
    _availableLanguages: Array<string>;

    /**
     * Whether the local participant can manage recording/transcription (moderator or holds the
     * recording/transcription feature claim).
     */
    _canManageRecordingOrTranscription: boolean;

    /**
     * Whether the local participant can start transcribing.
     */
    _canStartTranscribing: boolean;

    /**
     * Style of the dialogs feature.
     */
    _dialogStyles: any;

    /**
     * Whether any moderator has the regular Follow Me feature active.
     */
    _followMeActive: boolean;

    /**
     * Whether any moderator has the recorder Follow Me feature active.
     */
    _followMeRecorderActive: boolean;

    /**
     * Whether the local participant has the recorder Follow Me setting enabled.
     */
    _followMeRecorderEnabled: boolean;

    /**
     * Whether to hide the storage warning or not.
     */
    _hideStorageWarning: boolean;

    /**
     * Whether a live stream session is currently active.
     */
    _isLiveStreamRunning: boolean;

    /**
     * Whether the local participant is a moderator.
     */
    _isModerator: boolean;

    /**
     * Whether local recording is available or not.
     */
    _localRecordingAvailable: boolean;

    /**
     * Whether local recording is enabled or not.
     */
    _localRecordingEnabled: boolean;

    /**
     * Whether we won't notify the other participants about the recording.
     */
    _localRecordingNoNotification: boolean;

    /**
     * Whether a local recording is currently in progress.
     */
    _localRecordingRunning: boolean;

    /**
     * Whether self local recording is enabled or not.
     */
    _localRecordingSelfEnabled: boolean;

    /**
     * Whether to render recording.
     */
    _renderRecording: boolean;

    /**
     * The color-schemed stylesheet of this component.
     */
    _styles: any;

    /**
     * Whether transcription is currently running.
     */
    _transcriptionRunning: boolean;

    /**
     * CSS classes object (web only).
     */
    classes?: Partial<Record<string, string>>;

    /**
     * The redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether to show file recordings service, even if integrations
     * are enabled.
     */
    fileRecordingsServiceEnabled: boolean;

    /**
     * Whether to show the possibility to share file recording with other people (e.g. Meeting participants), based on
     * the actual implementation on the backend.
     */
    fileRecordingsServiceSharingEnabled: boolean;

    /**
     * If true the content related to the integrations will be shown.
     */
    integrationsEnabled: boolean;

    /**
     * <tt>true</tt> if we have valid oauth token.
     */
    isTokenValid: boolean;

    /**
     * <tt>true</tt> if we are in process of validating the oauth token.
     */
    isValidating: boolean;

    /**
     * Whether or not the current meeting is a vpaas one.
     */
    isVpaas: boolean;

    /**
     * Whether or not we should only record the local streams.
     */
    localRecordingOnlySelf?: boolean;

    /**
     * Callback to change the local recording only self setting.
     */
    onLocalRecordingSelfChange?: () => void;

    /**
     * The function will be called when the selected recording service changes.
     */
    onRecordingServiceChange: (service: string) => void;

    /**
     * Callback to be invoked on sharing setting change.
     */
    onSharingSettingChanged: () => void;

    /**
     * Starts every service which is not running.
     */
    onStartBoth: () => void;

    /**
     * Starts the audio & video recording.
     */
    onStartRecording: () => void;

    /**
     * Starts the transcription.
     */
    onStartTranscription: () => void;

    /**
     * Stops every running service.
     */
    onStopBoth: () => void;

    /**
     * Stops the audio & video recording.
     */
    onStopRecording: () => void;

    /**
     * Stops the transcription.
     */
    onStopTranscription: () => void;

    /**
     * Callback to be invoked when the transcription language changes.
     */
    onSubtitlesLanguageChange: (language: string) => void;

    /**
     * When false, the recording section starts collapsed and the
     * transcription section starts expanded, putting the focus on
     * transcription (e.g. subtitles/nudge flows).
     */
    recordAudioAndVideo?: boolean;

    /**
     * When true, audio/video recording is specifically in progress.
     */
    recordingRunning: boolean;

    /**
     * The ("translation-languages:" prefixed) language the transcription will
     * be saved in.
     */
    selectedLanguage: string | null;

    /**
     * The currently selected recording service of type: RECORDING_TYPES.
     */
    selectedRecordingService: string | null;

    /**
     * Boolean to set file recording sharing on or off.
     */
    sharingSetting: boolean;

    /**
     * Number of MiB of available space in user's Dropbox account.
     */
    spaceLeft?: number;

    /**
     * Whether the start recording action is currently unavailable (no usable
     * service selected).
     */
    startRecordingDisabled: boolean;

    /**
     * Whether transcription is currently running (from the dialog's point of
     * view, i.e. Only when the local participant can control it).
     */
    transcriptionRunning: boolean;

    /**
     * The display name of the user's Dropbox account.
     */
    userName?: string;
}

export interface IState {

    /**
     * Whether the language list is expanded (used by the native inline
     * picker; the web renders a combobox instead).
     */
    showLanguageList: boolean;

    /**
     * Whether the recording section options are expanded.
     */
    showRecordingOptions: boolean;

    /**
     * Whether the transcription section options are expanded.
     */
    showTranscriptionOptions: boolean;
}

/**
 * React Component for the recording & transcription dialog content: two
 * sections (audio & video recording, transcription), each with its own
 * start/stop button and a collapsible options area, plus footer buttons
 * acting on both services at once.
 *
 * @augments Component
 */
class AbstractStartRecordingDialogContent extends Component<IProps, IState> {
    /**
     * Initializes a new {@code AbstractStartRecordingDialogContent} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler; it bounds once for every instance.
        this._onSignIn = this._onSignIn.bind(this);
        this._onSignOut = this._onSignOut.bind(this);
        this._onRecordingServiceChange = this._onRecordingServiceChange.bind(this);
        this._onFollowMeRecorderChange = this._onFollowMeRecorderChange.bind(this);
        this._onToggleRecordingOptions = this._onToggleRecordingOptions.bind(this);
        this._onToggleTranscriptionOptions = this._onToggleTranscriptionOptions.bind(this);
        this._onToggleLanguageList = this._onToggleLanguageList.bind(this);

        // Both sections start collapsed, except transcription options are pre-expanded when a
        // caller (e.g. the transcription nudge) explicitly asks to focus transcription instead
        // of recording by passing recordAudioAndVideo: false.
        this.state = {
            showLanguageList: false,
            showRecordingOptions: false,
            showTranscriptionOptions: props.recordAudioAndVideo === false
        };
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    override componentDidUpdate(prevProps: IProps) {
        // Auto sign-out when the user chooses another recording service.
        if (prevProps.selectedRecordingService === RECORDING_TYPES.DROPBOX
                && this.props.selectedRecordingService !== RECORDING_TYPES.DROPBOX && this.props.isTokenValid) {
            this._onSignOut();
        }
    }

    /**
     * Toggles the recording section options.
     *
     * @returns {void}
     */
    _onToggleRecordingOptions() {
        this.setState({ showRecordingOptions: !this.state.showRecordingOptions });
    }

    /**
     * Toggles the transcription section options.
     *
     * @returns {void}
     */
    _onToggleTranscriptionOptions() {
        this.setState({ showTranscriptionOptions: !this.state.showTranscriptionOptions });
    }

    /**
     * Toggles the inline language list.
     *
     * @returns {void}
     */
    _onToggleLanguageList() {
        this.setState({ showLanguageList: !this.state.showLanguageList });
    }

    /**
     * Returns the list of recording services (RECORDING_TYPES values) the
     * participant can currently pick from.
     *
     * Cloud based services (Jitsi recording service, Dropbox) require the
     * recording JWT feature and are unavailable while a live stream runs
     * (both use Jibri). Dropbox is additionally unavailable while a session
     * is running (integrationsEnabled covers that).
     *
     * @returns {Array<string>}
     */
    _getRecordingServiceOptions(): Array<string> {
        const {
            _isLiveStreamRunning,
            _localRecordingAvailable,
            _renderRecording,
            fileRecordingsServiceEnabled,
            integrationsEnabled
        } = this.props;
        const options = [];

        if (_renderRecording && !_isLiveStreamRunning) {
            if (fileRecordingsServiceEnabled) {
                options.push(RECORDING_TYPES.JITSI_REC_SERVICE);
            }
            if (integrationsEnabled) {
                options.push(RECORDING_TYPES.DROPBOX);
            }
        }
        if (_localRecordingAvailable) {
            options.push(RECORDING_TYPES.LOCAL);
        }

        return options;
    }

    /**
     * Whether the audio & video recording section should be rendered.
     *
     * @param {Array<string>} [options] - The result of {@code _getRecordingServiceOptions()},
     * when the caller already computed it (avoids recomputing it a second time).
     * @returns {boolean}
     */
    _shouldRenderRecordingSection(options: Array<string> = this._getRecordingServiceOptions()) {
        return this.props.recordingRunning || options.length > 0;
    }

    /**
     * Whether the transcription section should be rendered.
     *
     * @returns {boolean}
     */
    _shouldRenderTranscriptionSection() {
        return this._canStartTranscribing() || this.props.transcriptionRunning;
    }

    /**
     * Whether the footer buttons (start both / stop both) should be rendered.
     * They only make sense when the participant can act on both services.
     *
     * @returns {boolean}
     */
    _shouldRenderFooter() {
        return this._shouldRenderRecordingSection() && this._shouldRenderTranscriptionSection();
    }

    /**
     * Whether the file sharing content should be rendered or not.
     *
     * @returns {boolean}
     */
    _shouldRenderFileSharingContent() {
        const {
            fileRecordingsServiceEnabled,
            fileRecordingsServiceSharingEnabled,
            isVpaas,
            selectedRecordingService
        } = this.props;

        if (!fileRecordingsServiceEnabled
            || !fileRecordingsServiceSharingEnabled
            || isVpaas
            || selectedRecordingService !== RECORDING_TYPES.JITSI_REC_SERVICE) {
            return false;
        }

        return true;
    }

    /**
     * Whether the recorder follow me option should be rendered: moderators
     * only, and only for the cloud based services which spawn a recorder
     * participant that can follow (local recordings record the own view).
     *
     * @returns {boolean}
     */
    _shouldRenderFollowMeRecorder() {
        const { _isModerator, selectedRecordingService } = this.props;

        return _isModerator
            && (selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE
                || selectedRecordingService === RECORDING_TYPES.DROPBOX);
    }

    /**
     * Whether the save transcription content should be rendered or not.
     *
     * @returns {boolean}
     */
    _canStartTranscribing() {
        return this.props._canStartTranscribing;
    }

    /**
     * Returns the translation key labelling the given recording service in
     * the storage service picker.
     *
     * @param {string} service - One of the RECORDING_TYPES values.
     * @returns {string}
     */
    _getServiceLabelKey(service: string | null) {
        switch (service) {
        case RECORDING_TYPES.JITSI_REC_SERVICE:
            return this.props.isVpaas ? 'recording.serviceDescriptionCloud' : 'recording.serviceName';
        case RECORDING_TYPES.DROPBOX:
            return 'recording.dropbox';
        case RECORDING_TYPES.LOCAL:
            return 'recording.localRecording';
        }

        return '';
    }

    /**
     * Returns the one line summary of the recording options, shown in the
     * collapsed accordion header: the selected storage service followed by
     * the state of its suboptions.
     *
     * @returns {string}
     */
    _getRecordingSummary() {
        const {
            isTokenValid,
            localRecordingOnlySelf,
            selectedRecordingService,
            sharingSetting,
            t,
            userName
        } = this.props;

        if (!selectedRecordingService) {
            return '';
        }

        const parts = [ t(this._getServiceLabelKey(selectedRecordingService)) ];

        switch (selectedRecordingService) {
        case RECORDING_TYPES.JITSI_REC_SERVICE:
            if (this._shouldRenderFileSharingContent()) {
                parts.push(t(sharingSetting ? 'recording.linkShared' : 'recording.linkNotShared'));
            }
            break;
        case RECORDING_TYPES.DROPBOX:
            parts.push(isTokenValid ? t('recording.loggedIn', { userName }) : t('recording.notSignedIn'));
            break;
        case RECORDING_TYPES.LOCAL:
            if (localRecordingOnlySelf) {
                parts.push(t('recording.onlyRecordSelf'));
            }
            break;
        }

        if (this._shouldRenderFollowMeRecorder() && this._isFollowMeRecorderChecked()) {
            parts.push(t('settings.followMeRecorder'));
        }

        return parts.join(' · ');
    }

    /**
     * Returns the one line summary of the transcription options, shown in the
     * collapsed accordion header: the selected language.
     *
     * @returns {string}
     */
    _getTranscriptionSummary() {
        const { selectedLanguage, t } = this.props;

        return selectedLanguage ? t(selectedLanguage) : '';
    }

    /**
     * Handler for recording service selection changes.
     *
     * @param {string} service - The newly selected service.
     * @returns {void}
     */
    _onRecordingServiceChange(service: string) {
        const { isTokenValid, onRecordingServiceChange, selectedRecordingService } = this.props;

        if (service === selectedRecordingService) {
            return;
        }

        onRecordingServiceChange(service);

        if (service === RECORDING_TYPES.DROPBOX && !isTokenValid) {
            this._onSignIn();
        }
    }

    /**
     * Handler for the recorder follow me setting.
     *
     * @param {boolean} enabled - The new value.
     * @returns {void}
     */
    _onFollowMeRecorderChange(enabled?: boolean) {
        const value = enabled ?? !this.props._followMeRecorderEnabled;

        this.props.dispatch(setFollowMeRecorderExclusive(value));
    }

    /**
     * Whether the recorder follow me option is checked.
     *
     * @returns {boolean}
     */
    _isFollowMeRecorderChecked() {
        const { _followMeRecorderActive, _followMeRecorderEnabled } = this.props;

        return _followMeRecorderEnabled && !_followMeRecorderActive;
    }

    /**
     * Whether the recorder follow me option is disabled: another moderator
     * has one of the follow me modes active, or a recording is already in
     * progress — the recorder cannot pick up the change after it started.
     *
     * @returns {boolean}
     */
    _isFollowMeRecorderDisabled() {
        const { _followMeActive, _followMeRecorderActive, recordingRunning } = this.props;

        return _followMeActive || _followMeRecorderActive || recordingRunning;
    }

    /**
     * Sings in a user.
     *
     * @returns {void}
     */
    _onSignIn() {
        sendAnalytics(createRecordingDialogEvent('start', 'signIn.button'));
        this.props.dispatch(authorizeDropbox());
    }

    /**
     * Sings out an user from dropbox.
     *
     * @returns {void}
     */
    _onSignOut() {
        sendAnalytics(createRecordingDialogEvent('start', 'signOut.button'));
        this.props.dispatch(updateDropboxToken());
    }
}

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
export function mapStateToProps(state: IReduxState) {
    const { localRecording, recordingService } = state['features/base/config'];
    const _localRecordingAvailable = !localRecording?.disable && supportsLocalRecording();
    const canManageRecordingOrTranscription
        = isLocalParticipantModerator(state) || hasRecordingOrTranscriptionFeature(state);
    const { followMeRecorderEnabled } = state['features/follow-me'];
    const subtitlesLanguage = state['features/subtitles']._language?.replace('translation-languages:', '');

    return {
        ..._abstractMapStateToProps(state),
        isVpaas: isVpaasMeeting(state),
        _availableLanguages: getAvailableSubtitlesLanguages(state, subtitlesLanguage)
            .map((lang: string) => `translation-languages:${lang}`),
        _canManageRecordingOrTranscription: canManageRecordingOrTranscription,
        _canStartTranscribing: canAddTranscriber(state),
        _followMeActive: isFollowMeActive(state),
        _followMeRecorderActive: isFollowMeRecorderActive(state),
        _followMeRecorderEnabled: Boolean(followMeRecorderEnabled),
        _isLiveStreamRunning: isLiveStreamingRunning(state),
        _hideStorageWarning: Boolean(recordingService?.hideStorageWarning),
        _isModerator: isLocalParticipantModerator(state),
        _renderRecording: isJwtFeatureEnabled(state, MEET_FEATURES.RECORDING, false),
        _transcriptionRunning: canManageRecordingOrTranscription ? isRecorderTranscriptionsRunning(state) : false,
        _localRecordingAvailable,
        _localRecordingEnabled: !localRecording?.disable,
        _localRecordingRunning: Boolean(state['features/recording'].localRecordingRunning),
        _localRecordingSelfEnabled: !localRecording?.disableSelfRecording,
        _localRecordingNoNotification: !localRecording?.notifyAllParticipants,
        _styles: ColorSchemeRegistry.get(state, 'StartRecordingDialogContent')
    };
}

export default AbstractStartRecordingDialogContent;

import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createRecordingDialogEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import ColorSchemeRegistry from '../../../base/color-scheme/ColorSchemeRegistry';
import { _abstractMapStateToProps } from '../../../base/dialog/functions';
import { authorizeDropbox, updateDropboxToken } from '../../../dropbox/actions';
import { setFollowMeRecorderExclusive } from '../../../follow-me/actions';
import { isVpaasMeeting } from '../../../jaas/functions';
import { getAvailableSubtitlesLanguages } from '../../../subtitles/functions.any';
import { RECORDING_TYPES } from '../../constants';

import { IRecordingDialogModel } from './dialogModel';

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
     * Style of the dialogs feature.
     */
    _dialogStyles: any;

    /**
     * Whether to hide the storage warning or not.
     */
    _hideStorageWarning: boolean;

    /**
     * Whether we won't notify the other participants about the recording.
     */
    _localRecordingNoNotification: boolean;

    /**
     * Whether self local recording is enabled or not.
     */
    _localRecordingSelfEnabled: boolean;

    /**
     * The color-schemed stylesheet of this component.
     */
    _styles: any;

    /**
     * CSS classes object (web only).
     */
    classes?: Partial<Record<string, string>>;

    /**
     * The redux dispatch function.
     */
    dispatch: IStore['dispatch'];

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
     * Every decision about what to show and what can be started, computed by the dialog.
     */
    model: IRecordingDialogModel;

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
     * The ("translation-languages:" prefixed) language the transcription will
     * be saved in.
     */
    selectedLanguage: string | null;

    /**
     * Boolean to set file recording sharing on or off.
     */
    sharingSetting: boolean;

    /**
     * Number of MiB of available space in user's Dropbox account.
     */
    spaceLeft?: number;

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
        if (prevProps.model.recording.selectedService === RECORDING_TYPES.DROPBOX
                && this.props.model.recording.selectedService !== RECORDING_TYPES.DROPBOX
                && this.props.isTokenValid) {
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
            model,
            sharingSetting,
            t,
            userName
        } = this.props;
        const { followMeRecorderChecked, selectedService, showFileSharing, showFollowMeRecorder } = model.recording;

        if (!selectedService) {
            return '';
        }

        const parts = [ t(this._getServiceLabelKey(selectedService)) ];

        switch (selectedService) {
        case RECORDING_TYPES.JITSI_REC_SERVICE:
            if (showFileSharing) {
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

        if (showFollowMeRecorder && followMeRecorderChecked) {
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
        const { isTokenValid, model, onRecordingServiceChange } = this.props;

        if (service === model.recording.selectedService) {
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
     * @param {boolean} [enabled] - The new value; toggles the switch when omitted.
     * @returns {void}
     */
    _onFollowMeRecorderChange(enabled?: boolean) {
        const value = enabled ?? !this.props.model.recording.followMeRecorderChecked;

        this.props.dispatch(setFollowMeRecorderExclusive(value));
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
    const subtitlesLanguage = state['features/subtitles']._language?.replace('translation-languages:', '');

    // Presentation only: every decision about what is shown and enabled comes with the model prop.
    return {
        ..._abstractMapStateToProps(state),
        isVpaas: isVpaasMeeting(state),
        _availableLanguages: getAvailableSubtitlesLanguages(state, subtitlesLanguage)
            .map((lang: string) => `translation-languages:${lang}`),
        _hideStorageWarning: Boolean(recordingService?.hideStorageWarning),
        _localRecordingSelfEnabled: !localRecording?.disableSelfRecording,
        _localRecordingNoNotification: !localRecording?.notifyAllParticipants,
        _styles: ColorSchemeRegistry.get(state, 'StartRecordingDialogContent')
    };
}

export default AbstractStartRecordingDialogContent;

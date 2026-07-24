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
import { isVpaasMeeting } from '../../../jaas/functions';
import { canAddTranscriber, isRecorderTranscriptionsRunning } from '../../../transcribing/functions';
import { RECORDING_TYPES } from '../../constants';
import { hasRecordingOrTranscriptionFeature, supportsLocalRecording } from '../../functions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractStartRecordingDialogContent}.
 */
export interface IProps extends WithTranslation {

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
     * Whether to hide the storage warning or not.
     */
    _hideStorageWarning: boolean;

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
     * The function will be called when there are changes related to the
     * switches.
     */
    onChange: Function;

    /**
     * Callback to change the local recording only self setting.
     */
    onLocalRecordingSelfChange?: () => void;

    /**
     * Callback to change the audio and video recording setting.
     */
    onRecordAudioAndVideoChange: Function;

    /**
     * Callback to be invoked on sharing setting change.
     */
    onSharingSettingChanged: () => void;

    /**
     * Callback to change the transcription recording setting.
     */
    onTranscriptionChange: Function;

    /**
     * When true, audio/video recording is specifically in progress.
     * The service selector is hidden since the destination cannot change mid-session.
     */
    recordingRunning?: boolean;

    /**
     * The currently selected recording service of type: RECORDING_TYPES.
     */
    selectedRecordingService: string | null;

    /**
     * When true, at least one service (recording or transcription) is active.
     * Used to bypass the _canStartTranscribing guard so the transcription toggle
     * remains visible for stopping.
     */
    servicesRunning?: boolean;

    /**
     * Boolean to set file recording sharing on or off.
     */
    sharingSetting: boolean;

    /**
     * Whether to show the audio and video related content.
     */
    shouldRecordAudioAndVideo: boolean;

    /**
     * Whether to show the transcription related content.
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

export interface IState {

    /**
     * Whether to show the advanced options or not.
     */
    showAdvancedOptions: boolean;
}

/**
 * React Component for getting confirmation to start a recording session.
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
        this._onDropboxSwitchChange = this._onDropboxSwitchChange.bind(this);
        this._onRecordingServiceSwitchChange = this._onRecordingServiceSwitchChange.bind(this);
        this._onLocalRecordingSwitchChange = this._onLocalRecordingSwitchChange.bind(this);
        this._onTranscriptionSwitchChange = this._onTranscriptionSwitchChange.bind(this);
        this._onRecordAudioAndVideoSwitchChange = this._onRecordAudioAndVideoSwitchChange.bind(this);
        this._onToggleShowOptions = this._onToggleShowOptions.bind(this);

        this.state = {
            showAdvancedOptions: true
        };
    }

    /**
     * Implements the Component's componentDidMount method.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        if (!this._shouldRenderNoIntegrationsContent()
            && !this._shouldRenderIntegrationsContent()
            && !this._shouldRenderFileSharingContent()) {
            const { _localRecordingAvailable, onChange, onRecordAudioAndVideoChange,
                selectedRecordingService, servicesRunning, shouldRecordAudioAndVideo } = this.props;

            // When a session is already active the initial toggle state is derived from what
            // is currently running — don't override it with the "fresh open" defaults.
            if (servicesRunning) {
                return;
            }

            if (!_localRecordingAvailable) {
                return;
            }

            // Pre-select local recording on open and ensure the audio/video flag is on
            // so _isChanged() reflects the selection and the Start button is enabled.
            // Done inline (not via _onLocalRecordingSwitchChange) to avoid the toggle-off
            // path that the same handler uses when the user deliberately deselects.
            if (!shouldRecordAudioAndVideo) {
                onRecordAudioAndVideoChange(true);
            }
            if (selectedRecordingService !== RECORDING_TYPES.LOCAL) {
                onChange(RECORDING_TYPES.LOCAL);
            }
        }
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    override componentDidUpdate(prevProps: IProps) {
        // Auto sign-out when the use chooses another recording service.
        if (prevProps.selectedRecordingService === RECORDING_TYPES.DROPBOX
                && this.props.selectedRecordingService !== RECORDING_TYPES.DROPBOX && this.props.isTokenValid) {
            this._onSignOut();
        }
    }

    /**
     * Returns whether the advanced options should be rendered.
     *
     * @returns {boolean}
     */
    _onToggleShowOptions() {
        this.setState({ showAdvancedOptions: !this.state.showAdvancedOptions });
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
     * Whether the save transcription content should be rendered or not.
     *
     * @returns {boolean}
     */
    _canStartTranscribing() {
        return this.props._canStartTranscribing;
    }

    /**
     * Whether the no integrations content should be rendered or not.
     *
     * @returns {boolean}
     */
    _shouldRenderNoIntegrationsContent() {
        // show the non integrations part only if fileRecordingsServiceEnabled
        // is enabled
        if (!this.props.fileRecordingsServiceEnabled) {
            return false;
        }

        return true;
    }

    /**
     * Whether the integrations content should be rendered or not.
     *
     * @returns {boolean}
     */
    _shouldRenderIntegrationsContent() {
        if (!this.props.integrationsEnabled) {
            return false;
        }

        return true;
    }

    /**
     * Handler for transcription switch change.
     *
     * @param {boolean} value - The new value.
     * @returns {void}
     */
    _onTranscriptionSwitchChange(value: boolean | undefined) {
        this.props.onTranscriptionChange(value);
    }

    /**
     * Handler for audio and video switch change.
     *
     * @param {boolean} value - The new value.
     * @returns {void}
     */
    _onRecordAudioAndVideoSwitchChange(value: boolean | undefined) {
        this.props.onRecordAudioAndVideoChange(value);
    }

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onRecordingServiceSwitchChange() {
        const {
            onChange,
            onRecordAudioAndVideoChange,
            onTranscriptionChange,
            selectedRecordingService,
            shouldRecordAudioAndVideo,
            shouldRecordTranscription
        } = this.props;

        if (selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE) {
            // Cloud is selected but both options are off (switch visually OFF) —
            // clicking re-enables both advanced options.
            if (!shouldRecordAudioAndVideo && !shouldRecordTranscription) {
                onRecordAudioAndVideoChange(true);
                onTranscriptionChange(true);
            }

            return;
        }

        onChange(RECORDING_TYPES.JITSI_REC_SERVICE);

        // If both options are off, re-enable them in the same click so the switch turns ON
        // immediately — without this, checked stays false until a second click.
        if (!shouldRecordAudioAndVideo && !shouldRecordTranscription) {
            onRecordAudioAndVideoChange(true);
            onTranscriptionChange(true);
        }
    }

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onDropboxSwitchChange() {
        const {
            isTokenValid,
            onChange,
            selectedRecordingService
        } = this.props;

        // act like group, cannot toggle off
        if (selectedRecordingService === RECORDING_TYPES.DROPBOX) {
            return;
        }

        onChange(RECORDING_TYPES.DROPBOX);

        if (!isTokenValid) {
            this._onSignIn();
        }
    }

    /**
     * Handler for onValueChange events from the Switch component.
     *
     * @returns {void}
     */
    _onLocalRecordingSwitchChange() {
        const {
            _localRecordingAvailable,
            onChange,
            onRecordAudioAndVideoChange,
            selectedRecordingService
        } = this.props;

        if (!_localRecordingAvailable) {
            return;
        }

        if (selectedRecordingService === RECORDING_TYPES.LOCAL) {
            // Deselect — lets the participant start transcription without local recording.
            onRecordAudioAndVideoChange(false);
            onChange('');

            return;
        }

        onRecordAudioAndVideoChange(true);
        onChange(RECORDING_TYPES.LOCAL);
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

    return {
        ..._abstractMapStateToProps(state),
        isVpaas: isVpaasMeeting(state),
        _canManageRecordingOrTranscription: canManageRecordingOrTranscription,
        _canStartTranscribing: canAddTranscriber(state),
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

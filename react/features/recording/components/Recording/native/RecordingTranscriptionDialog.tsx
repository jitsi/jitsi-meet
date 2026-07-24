import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
import HeaderNavigationButton
    from '../../../../mobile/navigation/components/HeaderNavigationButton';
import { goBack } from
    '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { RECORDING_TYPES } from '../../../constants';
import AbstractStartRecordingDialog, {
    IProps,
    mapStateToProps
} from '../AbstractStartRecordingDialog';
import styles from '../styles.native';

import StartRecordingDialogContent from './StartRecordingDialogContent';


/**
 * React Component for managing a recording/transcription session on native.
 * Handles both starting (when nothing is active) and managing toggles
 * (when a session is already running).
 *
 * @augments Component
 */
class RecordingTranscriptionDialog extends AbstractStartRecordingDialog {

    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onStartPress = this._onStartPress.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        super.componentDidMount();

        this._updateNavigationOptions();
    }

    /**
     * Implements React's {@link Component#componentDidUpdate()}.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidUpdate(prevProps: IProps) {
        super.componentDidUpdate(prevProps);

        this._updateNavigationOptions();
    }

    /**
     * Sets the header right button based on whether a session is active.
     *
     * @returns {void}
     */
    _updateNavigationOptions() {
        const { _localRecording, _recordingRunning, _transcriptionRunning, navigation, t } = this.props;
        const servicesRunning = Boolean(_recordingRunning || _transcriptionRunning || _localRecording);

        navigation.setOptions({
            // eslint-disable-next-line react/no-multi-comp
            headerRight: () => (
                <HeaderNavigationButton
                    disabled = { servicesRunning ? !this._isChanged() : this.isStartRecordingDisabled() }
                    label = { servicesRunning ? t('dialog.applyChanges') : t('dialog.start') }
                    onPress = { this._onStartPress }
                    twoActions = { true } />
            )
        });
    }

    /**
     * Applies changes and navigates back.
     *
     * @returns {void}
     */
    _onStartPress() {
        this._onSubmit() && goBack();
    }

    /**
     * Returns true when the start button should be disabled (no-session case).
     *
     * @returns {boolean}
     */
    isStartRecordingDisabled() {
        const {
            isTokenValid,
            selectedRecordingService,
            shouldRecordAudioAndVideo,
            shouldRecordTranscription
        } = this.state;

        if (!shouldRecordAudioAndVideo && !shouldRecordTranscription) {
            return true;
        }

        if (selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE) {
            return false;
        } else if (selectedRecordingService === RECORDING_TYPES.DROPBOX) {
            return !isTokenValid;
        }

        return true;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    override render() {
        const {
            _fileRecordingsServiceEnabled,
            _fileRecordingsServiceSharingEnabled,
            _recordingRunning,
            _transcriptionRunning
        } = this.props;
        const servicesRunning = Boolean(_recordingRunning || _transcriptionRunning);
        const {
            isTokenValid,
            isValidating,
            localRecordingOnlySelf,
            selectedRecordingService,
            sharingEnabled,
            shouldRecordAudioAndVideo,
            shouldRecordTranscription,
            spaceLeft,
            userName
        } = this.state;

        return (
            <JitsiScreen style = { styles.startRecodingContainer }>
                <StartRecordingDialogContent
                    fileRecordingsServiceEnabled = { _fileRecordingsServiceEnabled }
                    fileRecordingsServiceSharingEnabled = { _fileRecordingsServiceSharingEnabled }
                    integrationsEnabled = { this._areIntegrationsEnabled() }
                    isTokenValid = { isTokenValid }
                    isValidating = { isValidating }
                    localRecordingOnlySelf = { localRecordingOnlySelf }
                    onChange = { this._onSelectedRecordingServiceChanged }
                    onLocalRecordingSelfChange = { this._onLocalRecordingSelfChange }
                    onRecordAudioAndVideoChange = { this._onRecordAudioAndVideoChange }
                    onSharingSettingChanged = { this._onSharingSettingChanged }
                    onTranscriptionChange = { this._onTranscriptionChange }
                    recordingRunning = { Boolean(_recordingRunning) }
                    selectedRecordingService = { selectedRecordingService }
                    servicesRunning = { servicesRunning }
                    sharingSetting = { sharingEnabled }
                    shouldRecordAudioAndVideo = { shouldRecordAudioAndVideo }
                    shouldRecordTranscription = { shouldRecordTranscription }
                    spaceLeft = { spaceLeft }
                    userName = { userName } />
            </JitsiScreen>
        );
    }
}

export default translate(connect(mapStateToProps)(RecordingTranscriptionDialog));

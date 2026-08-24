import React from 'react';
import { ScrollView } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { translate } from '../../../../base/i18n/functions';
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
import { goBack } from
    '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import AbstractStartRecordingDialog, {
    IProps,
    mapStateToProps as abstractMapStateToProps
} from '../AbstractStartRecordingDialog';
import styles from '../styles.native';

import StartRecordingDialogContent from './StartRecordingDialogContent';


/**
 * React Component for managing a recording/transcription session on native.
 * Each section (audio & video recording, transcription) has its own
 * start/stop button which applies the action immediately and navigates back.
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

        this._onStartRecordingPress = this._onStartRecordingPress.bind(this);
        this._onStopRecordingPress = this._onStopRecordingPress.bind(this);
        this._onStartTranscriptionPress = this._onStartTranscriptionPress.bind(this);
        this._onStopTranscriptionPress = this._onStopTranscriptionPress.bind(this);
        this._onStartBothPress = this._onStartBothPress.bind(this);
        this._onStopBothPress = this._onStopBothPress.bind(this);
    }

    /**
     * Starts the recording and navigates back.
     *
     * @returns {void}
     */
    _onStartRecordingPress() {
        this._onStartRecording() && goBack();
    }

    /**
     * Stops the recording and navigates back.
     *
     * @returns {void}
     */
    _onStopRecordingPress() {
        this._onStopRecording() && goBack();
    }

    /**
     * Starts the transcription and navigates back.
     *
     * @returns {void}
     */
    _onStartTranscriptionPress() {
        this._onStartTranscription() && goBack();
    }

    /**
     * Stops the transcription and navigates back.
     *
     * @returns {void}
     */
    _onStopTranscriptionPress() {
        this._onStopTranscription() && goBack();
    }

    /**
     * Starts the services which are not running and navigates back.
     *
     * @returns {void}
     */
    _onStartBothPress() {
        this._onStartBoth() && goBack();
    }

    /**
     * Stops the running services and navigates back.
     *
     * @returns {void}
     */
    _onStopBothPress() {
        this._onStopBoth() && goBack();
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
        const {
            isTokenValid,
            isValidating,
            localRecordingOnlySelf,
            selectedLanguage,
            selectedRecordingService,
            sharingEnabled,
            spaceLeft,
            userName
        } = this.state;

        return (
            <JitsiScreen style = { styles.startRecodingContainer }>
                <ScrollView>
                    <StartRecordingDialogContent
                        fileRecordingsServiceEnabled = { _fileRecordingsServiceEnabled }
                        fileRecordingsServiceSharingEnabled = { _fileRecordingsServiceSharingEnabled }
                        integrationsEnabled = { this._areIntegrationsEnabled() }
                        isTokenValid = { isTokenValid }
                        isValidating = { isValidating }
                        localRecordingOnlySelf = { localRecordingOnlySelf }
                        onLocalRecordingSelfChange = { this._onLocalRecordingSelfChange }
                        onRecordingServiceChange = { this._onSelectedRecordingServiceChanged }
                        onSharingSettingChanged = { this._onSharingSettingChanged }
                        onStartBoth = { this._onStartBothPress }
                        onStartRecording = { this._onStartRecordingPress }
                        onStartTranscription = { this._onStartTranscriptionPress }
                        onStopBoth = { this._onStopBothPress }
                        onStopRecording = { this._onStopRecordingPress }
                        onStopTranscription = { this._onStopTranscriptionPress }
                        onSubtitlesLanguageChange = { this._onSubtitlesLanguageChanged }
                        recordingRunning = { Boolean(_recordingRunning) }
                        selectedLanguage = { selectedLanguage }
                        selectedRecordingService = { selectedRecordingService }
                        sharingSetting = { sharingEnabled }
                        spaceLeft = { spaceLeft }
                        startRecordingDisabled = { this._isStartRecordingDisabled() }
                        transcriptionRunning = { Boolean(_transcriptionRunning) }
                        userName = { userName } />
                </ScrollView>
            </JitsiScreen>
        );
    }
}

/**
 * Maps redux state to component props, bridging the navigation route params
 * (native-only) into the shared {@code recordAudioAndVideo} prop.
 *
 * @param {Object} state - Redux state.
 * @param {any} ownProps - Component's own props.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState, ownProps: any) {
    return {
        ...abstractMapStateToProps(state, {
            ...ownProps,
            recordAudioAndVideo: ownProps.recordAudioAndVideo ?? ownProps.route?.params?.recordAudioAndVideo
        })
    };
}

export default translate(connect(mapStateToProps)(RecordingTranscriptionDialog));

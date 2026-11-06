import React from 'react';
import { ScrollView } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { translate } from '../../../../base/i18n/functions';
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
import { goBack } from
    '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import AbstractStartRecordingDialog, {
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
     * Dismisses the screen by navigating back.
     *
     * @inheritdoc
     * @returns {void}
     */
    override _dismiss() {
        goBack();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    override render() {
        const {
            recordAudioAndVideo
        } = this.props;
        const {
            isTokenValid,
            isValidating,
            localRecordingOnlySelf,
            selectedLanguage,
            sharingEnabled,
            spaceLeft,
            userName
        } = this.state;

        return (
            <JitsiScreen style = { styles.startRecodingContainer }>
                <ScrollView>
                    <StartRecordingDialogContent
                        isTokenValid = { isTokenValid }
                        isValidating = { isValidating }
                        localRecordingOnlySelf = { localRecordingOnlySelf }
                        model = { this._getModel() }
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
                        recordAudioAndVideo = { recordAudioAndVideo }
                        selectedLanguage = { selectedLanguage }
                        sharingSetting = { sharingEnabled }
                        spaceLeft = { spaceLeft }
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
 * @param {any} ownProps - Component's own props. Kept as `any`: this component is registered
 * directly as a react-navigation Screen (see ConferenceNavigationContainer.tsx), whose generic
 * `route`/`navigation` prop types don't compose with a narrower own-props type here without
 * modeling the whole navigation ParamList, which AbstractStartRecordingDialog's own
 * mapStateToProps(_ownProps: any) already opts out of for the same reason.
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

import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconArrowDown, IconArrowRight } from '../../../../base/icons/svg';
import LoadingIndicator from '../../../../base/react/components/native/LoadingIndicator';
import Button from '../../../../base/ui/components/native/Button';
import Switch from '../../../../base/ui/components/native/Switch';
import { BUTTON_TYPES } from '../../../../base/ui/constants.native';
import LanguageListItem from '../../../../subtitles/components/native/LanguageListItem';
import { RECORDING_TYPES } from '../../../constants';
import { getRecordingDurationEstimation } from '../../../functions';
import AbstractStartRecordingDialogContent, { IProps, mapStateToProps } from '../AbstractStartRecordingDialogContent';
import {
    ICON_INFO,
    ICON_USERS
} from '../styles.native';

import RecordingOptionRow from './RecordingOptionRow';


/**
 * The recording & transcription dialog content for the mobile application.
 */
class StartRecordingDialogContent extends AbstractStartRecordingDialogContent {
    /**
     * Initializes a new {@code StartRecordingDialogContent} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onLanguageSelected = this._onLanguageSelected.bind(this);
    }

    /**
     * Handles a language selection from the inline language list: applies it
     * and collapses the list.
     *
     * @param {string} language - The selected ("translation-languages:"
     * prefixed) language.
     * @returns {void}
     */
    _onLanguageSelected(language: string) {
        this.props.onSubtitlesLanguageChange(language);
        this.setState({ showLanguageList: false });
    }

    /**
     * Renders the component.
     *
     * @protected
     * @returns {React$Component}
     */
    override render() {
        const { _styles: styles } = this.props;

        return (
            <View style = { styles.container }>
                { this._renderRecordingSection() }
                { this._renderTranscriptionSection() }
                { this._renderFooter() }
            </View>
        );
    }

    /**
     * Renders a section header: title and the start/stop button of the
     * section's service.
     *
     * @param {Object} options - Rendering options.
     * @returns {React$Component}
     */
    _renderSectionHeader({ onButtonPress, running, startDisabled, startLabelKey, stopLabelKey, titleKey }: {
        onButtonPress: () => void;
        running: boolean;
        startDisabled?: boolean;
        startLabelKey: string;
        stopLabelKey: string;
        titleKey: string;
    }) {
        const { _dialogStyles, _styles: styles, t } = this.props;

        return (
            <View style = { styles.header }>
                <Text
                    style = {{
                        ..._dialogStyles.text,
                        ...styles.title
                    }}>
                    { t(titleKey) }
                </Text>
                <Button
                    accessibilityLabel = { running ? stopLabelKey : startLabelKey }
                    disabled = { !running && startDisabled }
                    labelKey = { running ? 'dialog.stop' : 'dialog.start' }
                    onClick = { onButtonPress }
                    type = { running ? BUTTON_TYPES.DESTRUCTIVE : BUTTON_TYPES.PRIMARY } />
            </View>
        );
    }

    /**
     * Renders the accordion wrapping a section's options: a header with the
     * options title, a one line summary of the current choices and a chevron,
     * followed by the options themselves when expanded.
     *
     * @param {Object} options - Rendering options.
     * @returns {React$Component}
     */
    _renderAccordion({ body, expanded, onToggle, summary, titleKey }: {
        body: React.ReactNode;
        expanded: boolean;
        onToggle: () => void;
        summary: string;
        titleKey: string;
    }) {
        const { _styles: styles, t } = this.props;

        return (
            <View style = { styles.accordion }>
                <TouchableOpacity
                    accessibilityLabel = { t(titleKey) }
                    accessibilityRole = 'button'
                    accessibilityState = {{ expanded }}
                    onPress = { onToggle }
                    style = { styles.accordionHeader }>
                    <View style = { styles.accordionText }>
                        <Text style = { styles.accordionTitle }>
                            { t(titleKey) }
                        </Text>
                        { !expanded && (
                            <Text
                                numberOfLines = { 1 }
                                style = { styles.accordionSummary }>
                                { summary }
                            </Text>
                        ) }
                    </View>
                    <Icon
                        size = { 18 }
                        src = { IconArrowDown }
                        style = { expanded ? styles.accordionChevronOpen : undefined } />
                </TouchableOpacity>
                { expanded && (
                    <View style = { styles.accordionBody }>
                        { body }
                    </View>
                ) }
            </View>
        );
    }

    /**
     * Renders the audio & video recording section.
     *
     * @returns {React$Component}
     */
    _renderRecordingSection() {
        const recordingServiceOptions = this._getRecordingServiceOptions();

        if (!this._shouldRenderRecordingSection(recordingServiceOptions)) {
            return null;
        }

        const {
            _dialogStyles,
            _styles: styles,
            isValidating,
            onStartRecording,
            onStopRecording,
            recordingRunning,
            selectedRecordingService,
            startRecordingDisabled,
            t
        } = this.props;
        const { showRecordingOptions } = this.state;

        return (
            <View style = { styles.section }>
                { this._renderSectionHeader({
                    onButtonPress: recordingRunning ? onStopRecording : onStartRecording,
                    running: recordingRunning,
                    startDisabled: startRecordingDisabled || isValidating,
                    startLabelKey: 'dialog.startRecording',
                    stopLabelKey: 'dialog.stopRecording',
                    titleKey: 'recording.recordAudioAndVideo'
                }) }
                { this._renderAccordion({
                    body: (
                        <>
                            <Text
                                style = {{
                                    ..._dialogStyles.text,
                                    ...styles.pickerLabel
                                }}>
                                { t('recording.storageLocation') }
                            </Text>
                            { recordingServiceOptions.map(service => (
                                <RecordingOptionRow
                                    disabled = { recordingRunning || isValidating }
                                    key = { service }
                                    label = { t(this._getServiceLabelKey(service)) }
                                    onSelect = { this._onRecordingServiceChange }
                                    selected = { selectedRecordingService === service }
                                    value = { service } />
                            )) }
                            { selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE
                                && this._renderJitsiServiceOptions() }
                            { selectedRecordingService === RECORDING_TYPES.DROPBOX
                                && this._renderDropboxOptions() }
                            { this._renderFollowMeRecorder() }
                        </>
                    ),
                    expanded: showRecordingOptions,
                    onToggle: this._onToggleRecordingOptions,

                    // Only rendered by _renderAccordion while collapsed — skip computing it
                    // (and its nested t() calls) while the section is expanded.
                    summary: showRecordingOptions ? '' : this._getRecordingSummary(),
                    titleKey: 'recording.recordingOptions'
                }) }
            </View>
        );
    }

    /**
     * Renders the options of the Jitsi recording service: the recording link
     * sharing switch and the vpaas storage warning.
     *
     * @returns {React$Component}
     */
    _renderJitsiServiceOptions() {
        const {
            _dialogStyles,
            _styles: styles,
            isValidating,
            onSharingSettingChanged,
            recordingRunning,
            sharingSetting,
            t
        } = this.props;

        return (
            <>
                { this._shouldRenderFileSharingContent() && (
                    <View
                        key = 'fileSharingSetting'
                        style = { styles.headerNested }>
                        <Image
                            source = { ICON_USERS }
                            style = { styles.recordingIcon } />
                        <Text
                            style = {{
                                ..._dialogStyles.text,
                                ...styles.optionLabel
                            }}>
                            { t('recording.fileSharingdescription') }
                        </Text>
                        <Switch
                            checked = { sharingSetting }
                            disabled = { isValidating || recordingRunning }
                            onChange = { onSharingSettingChanged }
                            style = { styles.switch } />
                    </View>
                ) }
                { this._renderUploadToTheCloudInfo() }
            </>
        );
    }

    /**
     * Renders the info in case recording is uploaded to the cloud.
     *
     * @returns {React$Component}
     */
    _renderUploadToTheCloudInfo() {
        const {
            _dialogStyles,
            _hideStorageWarning,
            _styles: styles,
            isVpaas,
            t
        } = this.props;

        if (!isVpaas || _hideStorageWarning) {
            return null;
        }

        return (
            <View
                key = 'cloudUploadInfo'
                style = { styles.headerInfo }>
                <Image
                    source = { ICON_INFO }
                    style = { styles.recordingInfoIcon } />
                <Text
                    style = {{
                        ..._dialogStyles.text,
                        ...styles.titleInfo
                    }}>
                    { t('recording.serviceDescriptionCloudInfo') }
                </Text>
            </View>
        );
    }

    /**
     * Renders the Dropbox account area: sign in button, or account info plus
     * sign out button once authorized.
     *
     * @returns {React$Component}
     */
    _renderDropboxOptions() {
        const { _dialogStyles, _styles: styles, isTokenValid, isValidating, spaceLeft, t, userName } = this.props;

        if (isValidating) {
            return (
                <View style = { styles.loggedIn }>
                    <LoadingIndicator size = 'small' />
                </View>
            );
        }

        if (!isTokenValid) {
            return (
                <View style = { styles.headerNested }>
                    <Text
                        style = {{
                            ..._dialogStyles.text,
                            ...styles.optionLabel
                        }}>
                        { t('recording.dropboxSignInPrompt') }
                    </Text>
                    <Button
                        accessibilityLabel = 'recording.signIn'
                        labelKey = 'recording.signIn'
                        onClick = { this._onSignIn }
                        type = { BUTTON_TYPES.PRIMARY } />
                </View>
            );
        }

        const duration = getRecordingDurationEstimation(spaceLeft);

        return (
            <View style = { styles.headerNested }>
                <View style = { styles.loggedInInfo }>
                    <Text
                        style = { [
                            styles.text,
                            styles.recordingText
                        ] }>
                        { t('recording.loggedIn', { userName }) }
                    </Text>
                    <Text
                        style = { [
                            styles.text,
                            styles.recordingText
                        ] }>
                        {
                            t('recording.availableSpace', {
                                spaceLeft,
                                duration
                            })
                        }
                    </Text>
                </View>
                <Button
                    accessibilityLabel = 'recording.signOut'
                    labelKey = 'recording.signOut'
                    onClick = { this._onSignOut }
                    type = { BUTTON_TYPES.SECONDARY } />
            </View>
        );
    }

    /**
     * Renders the recorder follow me switch for cloud based recordings.
     *
     * @returns {React$Component}
     */
    _renderFollowMeRecorder() {
        if (!this._shouldRenderFollowMeRecorder()) {
            return null;
        }

        const { _dialogStyles, _styles: styles, t } = this.props;

        return (
            <View style = { styles.headerNested }>
                <Text
                    style = {{
                        ..._dialogStyles.text,
                        ...styles.optionLabel
                    }}>
                    { t('settings.followMeRecorder') }
                </Text>
                <Switch
                    checked = { this._isFollowMeRecorderChecked() }
                    disabled = { this._isFollowMeRecorderDisabled() }
                    onChange = { this._onFollowMeRecorderChange }
                    style = { styles.switch } />
            </View>
        );
    }

    /**
     * Renders the transcription section with the inline language picker.
     *
     * @returns {React$Component}
     */
    _renderTranscriptionSection() {
        if (!this._shouldRenderTranscriptionSection()) {
            return null;
        }

        const {
            _availableLanguages,
            _dialogStyles,
            _styles: styles,
            onStartTranscription,
            onStopTranscription,
            selectedLanguage,
            t,
            transcriptionRunning
        } = this.props;
        const { showLanguageList, showTranscriptionOptions } = this.state;

        return (
            <View style = { styles.section }>
                { this._renderSectionHeader({
                    onButtonPress: transcriptionRunning ? onStopTranscription : onStartTranscription,
                    running: transcriptionRunning,
                    startLabelKey: 'dialog.startTranscription',
                    stopLabelKey: 'dialog.stopTranscription',
                    titleKey: 'recording.recordTranscription'
                }) }
                { this._renderAccordion({
                    body: (
                        <>
                            <View style = { styles.headerNested }>
                                <Text
                                    style = {{
                                        ..._dialogStyles.text,
                                        ...styles.pickerLabel
                                    }}>
                                    { `${t('recording.transcriptionLanguage')}: ${t(selectedLanguage ?? '')}` }
                                </Text>
                                <Icon
                                    ariaPressed = { showLanguageList }
                                    onClick = { transcriptionRunning ? undefined : this._onToggleLanguageList }
                                    role = 'button'
                                    size = { 24 }
                                    src = { showLanguageList ? IconArrowDown : IconArrowRight } />
                            </View>
                            { showLanguageList && !transcriptionRunning
                                && _availableLanguages.map((language: string) => (
                                    <LanguageListItem
                                        key = { language }
                                        lang = { language }
                                        onLanguageSelected = { this._onLanguageSelected }
                                        selected = { selectedLanguage === language } />
                                )) }
                        </>
                    ),
                    expanded: showTranscriptionOptions,
                    onToggle: this._onToggleTranscriptionOptions,

                    // Only rendered by _renderAccordion while collapsed — skip computing it while
                    // the section is expanded.
                    summary: showTranscriptionOptions ? '' : this._getTranscriptionSummary(),
                    titleKey: 'recording.transcriptionOptions'
                }) }
            </View>
        );
    }

    /**
     * Renders the footer buttons acting on both services at once. When only
     * one service is running both buttons are shown: stop both stops the
     * running one, start both starts the missing one.
     *
     * @returns {React$Component}
     */
    _renderFooter() {
        if (!this._shouldRenderFooter()) {
            return null;
        }

        const {
            _styles: styles,
            isValidating,
            onStartBoth,
            onStopBoth,
            recordingRunning,
            startRecordingDisabled,
            transcriptionRunning
        } = this.props;
        const showStopBoth = recordingRunning || transcriptionRunning;
        const showStartBoth = !recordingRunning || !transcriptionRunning;
        const startBothDisabled = !recordingRunning && (startRecordingDisabled || isValidating);

        return (
            <View style = { styles.footer }>
                { showStopBoth && (
                    <Button
                        accessibilityLabel = 'dialog.stopBoth'
                        labelKey = 'dialog.stopBoth'
                        onClick = { onStopBoth }
                        style = { styles.footerButton }
                        type = { BUTTON_TYPES.DESTRUCTIVE } />
                ) }
                { showStartBoth && (
                    <Button
                        accessibilityLabel = 'dialog.startBoth'
                        disabled = { startBothDisabled }
                        labelKey = 'dialog.startBoth'
                        onClick = { onStartBoth }
                        style = { styles.footerButton }
                        type = { BUTTON_TYPES.PRIMARY } />
                ) }
            </View>
        );
    }
}

export default translate(connect(mapStateToProps)(StartRecordingDialogContent));

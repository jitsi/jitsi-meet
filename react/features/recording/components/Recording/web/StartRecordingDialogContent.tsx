import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { translate } from '../../../../base/i18n/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconArrowDown } from '../../../../base/icons/svg';
import Container from '../../../../base/react/components/web/Container';
import Image from '../../../../base/react/components/web/Image';
import LoadingIndicator from '../../../../base/react/components/web/LoadingIndicator';
import Text from '../../../../base/react/components/web/Text';
import Button from '../../../../base/ui/components/web/Button';
import Switch from '../../../../base/ui/components/web/Switch';
import { BUTTON_TYPES } from '../../../../base/ui/constants.web';
import { RECORDING_TYPES } from '../../../constants';
import { getRecordingDurationEstimation } from '../../../functions';
import AbstractStartRecordingDialogContent, { mapStateToProps } from '../AbstractStartRecordingDialogContent';
import {
    ICON_INFO,
    ICON_USERS,
    startRecordingDialogStyles
} from '../styles.web';

import DropdownSelect from './DropdownSelect';

const EMPTY_FUNCTION = () => {
    // empty
};

/**
 * The recording & transcription dialog content for the web application.
 */
class StartRecordingDialogContent extends AbstractStartRecordingDialogContent {
    override render() {
        const classes = this.props.classes ?? {};

        return (
            <Container className = { classes.container }>
                { this._renderRecordingSection() }
                { this._renderTranscriptionSection() }
                { this._renderFooter() }
            </Container>
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
    _renderAccordion({ body, expanded, id, onToggle, summary, titleKey }: {
        body: React.ReactNode;
        expanded: boolean;
        id: string;
        onToggle: () => void;
        summary: string;
        titleKey: string;
    }) {
        const { t } = this.props;
        const classes = this.props.classes ?? {};

        return (
            <Container className = { classes.accordion }>
                <button
                    aria-controls = { `${id}-content` }
                    aria-expanded = { expanded }
                    className = { classes.accordionHeader }
                    id = { id }
                    onClick = { onToggle }
                    type = 'button'>
                    <Container className = { classes.accordionText }>
                        <span className = { classes.accordionTitle }>
                            { t(titleKey) }
                        </span>
                        { !expanded && (
                            <span className = { classes.accordionSummary }>
                                { summary }
                            </span>
                        ) }
                    </Container>
                    <Icon
                        className = { `${classes.accordionChevron} ${expanded ? classes.accordionChevronOpen : ''}` }
                        size = { 18 }
                        src = { IconArrowDown } />
                </button>
                { expanded && (
                    <div
                        className = { classes.accordionBody }
                        id = { `${id}-content` }>
                        { body }
                    </div>
                ) }
            </Container>
        );
    }

    /**
     * Renders the audio & video recording section: the action row with the
     * start/stop button and the options accordion holding the storage service
     * combobox and the selected service's options.
     *
     * @returns {React$Component}
     */
    _renderRecordingSection() {
        const recordingServiceOptions = this._getRecordingServiceOptions();

        if (!this._shouldRenderRecordingSection(recordingServiceOptions)) {
            return null;
        }

        const {
            isValidating,
            onStartRecording,
            onStopRecording,
            recordingRunning,
            selectedRecordingService,
            startRecordingDisabled,
            t
        } = this.props;
        const { showRecordingOptions } = this.state;
        const classes = this.props.classes ?? {};
        const serviceOptions = recordingServiceOptions.map(service => {
            return {
                label: t(this._getServiceLabelKey(service)),
                value: service
            };
        });

        return (
            <Container className = { classes.section }>
                <Container className = { classes.header }>
                    <label className = { classes.titleNoMargin }>
                        { t('recording.recordAudioAndVideo') }
                    </label>
                    <Container className = { classes.switch }>
                        { recordingRunning ? (
                            <Button
                                accessibilityLabel = { t('dialog.stopRecording') }
                                labelKey = 'dialog.stop'
                                onClick = { onStopRecording }
                                testId = 'recordingDialog.stopRecording'
                                type = { BUTTON_TYPES.DESTRUCTIVE } />
                        ) : (
                            <Button
                                accessibilityLabel = { t('dialog.startRecording') }
                                disabled = { startRecordingDisabled || isValidating }
                                labelKey = 'dialog.start'
                                onClick = { onStartRecording }
                                testId = 'recordingDialog.startRecording'
                                type = { BUTTON_TYPES.PRIMARY } />
                        ) }
                    </Container>
                </Container>
                { this._renderAccordion({
                    body: (
                        <>
                            <DropdownSelect
                                disabled = { recordingRunning || isValidating }
                                id = 'recording-service-select'
                                label = { t('recording.storageLocation') }
                                onChange = { this._onRecordingServiceChange }
                                options = { serviceOptions }
                                value = { selectedRecordingService ?? '' } />
                            { selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE
                                && this._renderJitsiServiceOptions() }
                            { selectedRecordingService === RECORDING_TYPES.DROPBOX
                                && this._renderDropboxOptions() }
                            { selectedRecordingService === RECORDING_TYPES.LOCAL
                                && this._renderLocalRecordingOptions() }
                            { this._renderFollowMeRecorder() }
                        </>
                    ),
                    expanded: showRecordingOptions,
                    id: 'recording-options',
                    onToggle: this._onToggleRecordingOptions,

                    // Only rendered by _renderAccordion while collapsed — skip computing it
                    // (and its nested t() calls) while the section is expanded.
                    summary: showRecordingOptions ? '' : this._getRecordingSummary(),
                    titleKey: 'recording.recordingOptions'
                }) }
            </Container>
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
            isValidating,
            onSharingSettingChanged,
            recordingRunning,
            sharingSetting,
            t
        } = this.props;
        const classes = this.props.classes ?? {};

        return (
            <>
                { this._shouldRenderFileSharingContent() && (
                    <Container
                        className = { `${classes.header} ${classes.headerSpaceTop}` }
                        key = 'fileSharingSetting'>
                        <Container className = { `${classes.iconContainer} ${classes.fileSharingIconContainer}` }>
                            <Image
                                alt = ''
                                className = { classes.fileSharingIcon }
                                src = { ICON_USERS } />
                        </Container>
                        <label
                            className = { classes.title }
                            htmlFor = 'recording-switch-share'>
                            { t('recording.fileSharingdescription') }
                        </label>
                        <Switch
                            checked = { sharingSetting }
                            className = { classes.switch }
                            disabled = { isValidating || recordingRunning }
                            id = 'recording-switch-share'
                            onChange = { onSharingSettingChanged } />
                    </Container>
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
            _hideStorageWarning,
            isVpaas,
            t
        } = this.props;

        if (!isVpaas || _hideStorageWarning) {
            return null;
        }

        const classes = this.props.classes ?? {};

        return (
            <Container
                className = { classes.info }
                key = 'cloudUploadInfo'>
                <Image
                    alt = ''
                    className = { classes.infoIcon }
                    src = { ICON_INFO } />
                <Text className = { classes.infoTitle }>
                    { t('recording.serviceDescriptionCloudInfo') }
                </Text>
            </Container>
        );
    }

    /**
     * Renders the Dropbox account area: sign in button, or account info plus
     * sign out button once authorized.
     *
     * @returns {React$Component}
     */
    _renderDropboxOptions() {
        const {
            isTokenValid,
            isValidating,
            spaceLeft,
            t,
            userName
        } = this.props;
        const classes = this.props.classes ?? {};

        if (isValidating) {
            return (
                <Container className = { classes.authorizationPanel }>
                    <LoadingIndicator size = 'small' />
                </Container>
            );
        }

        if (!isTokenValid) {
            return (
                <Container className = { `${classes.header} ${classes.headerSpaceTop}` }>
                    <span className = { classes.optionLabel }>
                        { t('recording.dropboxSignInPrompt') }
                    </span>
                    <Container className = { classes.switch }>
                        <Button
                            accessibilityLabel = { t('recording.signIn') }
                            labelKey = 'recording.signIn'
                            onClick = { this._onSignIn }
                            type = { BUTTON_TYPES.PRIMARY } />
                    </Container>
                </Container>
            );
        }

        const duration = getRecordingDurationEstimation(spaceLeft);

        return (
            <Container className = { `${classes.header} ${classes.headerSpaceTop}` }>
                <Container className = { classes.loggedInPanel }>
                    <Container>
                        <Text>
                            { t('recording.loggedIn', { userName }) }
                        </Text>
                    </Container>
                    <Container>
                        <Text>
                            {
                                t('recording.availableSpace', {
                                    spaceLeft,
                                    duration
                                })
                            }
                        </Text>
                    </Container>
                </Container>
                <Container className = { classes.switch }>
                    <Button
                        accessibilityLabel = { t('recording.signOut') }
                        labelKey = 'recording.signOut'
                        onClick = { this._onSignOut }
                        type = { BUTTON_TYPES.SECONDARY } />
                </Container>
            </Container>
        );
    }

    /**
     * Renders the options for local recordings.
     *
     * @returns {React$Component}
     */
    _renderLocalRecordingOptions() {
        const {
            _localRecordingNoNotification,
            _localRecordingSelfEnabled,
            isValidating,
            localRecordingOnlySelf,
            onLocalRecordingSelfChange,
            recordingRunning,
            t
        } = this.props;
        const classes = this.props.classes ?? {};

        return (
            <>
                { _localRecordingSelfEnabled && (
                    <Container className = { `${classes.header} ${classes.headerSpaceTop}` }>
                        <Container className = { `${classes.iconContainer} ${classes.fileSharingIconContainer}` }>
                            <Image
                                alt = ''
                                className = { classes.fileSharingIcon }
                                src = { ICON_USERS } />
                        </Container>
                        <label
                            className = { classes.title }
                            htmlFor = 'recording-switch-myself'>
                            { t('recording.onlyRecordSelf') }
                        </label>
                        <Switch
                            checked = { Boolean(localRecordingOnlySelf) }
                            className = { classes.switch }
                            disabled = { isValidating || recordingRunning }
                            id = 'recording-switch-myself'
                            onChange = { onLocalRecordingSelfChange ?? EMPTY_FUNCTION } />
                    </Container>
                ) }
                <Text className = { `${classes.localRecordingWarning} ${classes.localRecordingWarningText}` }>
                    { t('recording.localRecordingWarning') }
                </Text>
                { _localRecordingNoNotification && !localRecordingOnlySelf
                    && <Text className = { `${classes.localRecordingWarning} ${classes.localRecordingWarningNotification}` }>
                        { t('recording.localRecordingNoNotificationWarning') }
                    </Text>
                }
            </>
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

        const { t } = this.props;
        const classes = this.props.classes ?? {};

        return (
            <Container className = { `${classes.header} ${classes.headerSpaceTop}` }>
                <label
                    className = { classes.optionLabel }
                    htmlFor = 'recording-switch-follow-me'>
                    { t('settings.followMeRecorder') }
                </label>
                <Switch
                    checked = { this._isFollowMeRecorderChecked() }
                    className = { classes.switch }
                    disabled = { this._isFollowMeRecorderDisabled() }
                    id = 'recording-switch-follow-me'
                    onChange = { this._onFollowMeRecorderChange } />
            </Container>
        );
    }

    /**
     * Renders the transcription section: header with the start/stop button
     * and a collapsible area holding the language combobox.
     *
     * @returns {React$Component}
     */
    _renderTranscriptionSection() {
        if (!this._shouldRenderTranscriptionSection()) {
            return null;
        }

        const {
            _availableLanguages,
            onStartTranscription,
            onStopTranscription,
            selectedLanguage,
            t,
            transcriptionRunning
        } = this.props;
        const { showTranscriptionOptions } = this.state;
        const classes = this.props.classes ?? {};
        const languageOptions = _availableLanguages.map((lang: string) => {
            return {
                label: t(lang),
                value: lang
            };
        });

        return (
            <Container className = { classes.section }>
                <Container className = { classes.header }>
                    <label className = { classes.titleNoMargin }>
                        { t('recording.recordTranscription') }
                    </label>
                    <Container className = { classes.switch }>
                        { transcriptionRunning ? (
                            <Button
                                accessibilityLabel = { t('dialog.stopTranscription') }
                                labelKey = 'dialog.stop'
                                onClick = { onStopTranscription }
                                testId = 'recordingDialog.stopTranscription'
                                type = { BUTTON_TYPES.DESTRUCTIVE } />
                        ) : (
                            <Button
                                accessibilityLabel = { t('dialog.startTranscription') }
                                labelKey = 'dialog.start'
                                onClick = { onStartTranscription }
                                testId = 'recordingDialog.startTranscription'
                                type = { BUTTON_TYPES.PRIMARY } />
                        ) }
                    </Container>
                </Container>
                { this._renderAccordion({
                    body: (
                        <DropdownSelect
                            disabled = { transcriptionRunning }
                            id = 'transcription-language-select'
                            label = { t('recording.transcriptionLanguage') }
                            onChange = { this.props.onSubtitlesLanguageChange }
                            options = { languageOptions }
                            value = { selectedLanguage ?? '' } />
                    ),
                    expanded: showTranscriptionOptions,
                    id: 'transcription-options',
                    onToggle: this._onToggleTranscriptionOptions,

                    // Only rendered by _renderAccordion while collapsed — skip computing it while
                    // the section is expanded.
                    summary: showTranscriptionOptions ? '' : this._getTranscriptionSummary(),
                    titleKey: 'recording.transcriptionOptions'
                }) }
            </Container>
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
            isValidating,
            onStartBoth,
            onStopBoth,
            recordingRunning,
            startRecordingDisabled,
            t,
            transcriptionRunning
        } = this.props;
        const showStopBoth = recordingRunning || transcriptionRunning;
        const showStartBoth = !recordingRunning || !transcriptionRunning;
        const startBothDisabled = !recordingRunning && (startRecordingDisabled || isValidating);
        const classes = this.props.classes ?? {};

        return (
            <Container className = { classes.footer }>
                { showStopBoth && (
                    <Button
                        accessibilityLabel = { t('dialog.stopBoth') }
                        labelKey = 'dialog.stopBoth'
                        onClick = { onStopBoth }
                        testId = 'recordingDialog.stopBoth'
                        type = { BUTTON_TYPES.DESTRUCTIVE } />
                ) }
                { showStartBoth && (
                    <Button
                        accessibilityLabel = { t('dialog.startBoth') }
                        disabled = { startBothDisabled }
                        labelKey = 'dialog.startBoth'
                        onClick = { onStartBoth }
                        testId = 'recordingDialog.startBoth'
                        type = { BUTTON_TYPES.PRIMARY } />
                ) }
            </Container>
        );
    }
}

export default withStyles(translate(connect(mapStateToProps)(StartRecordingDialogContent)), startRecordingDialogStyles);

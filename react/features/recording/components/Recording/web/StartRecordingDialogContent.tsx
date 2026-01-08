import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconArrowDown, IconArrowRight } from '../../../../base/icons/svg';
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
    DROPBOX_LOGO,
    ICON_CLOUD,
    ICON_INFO,
    ICON_USERS,
    LOCAL_RECORDING
} from '../styles.web';

const EMPTY_FUNCTION = () => {
    // empty
};

/**
 * The start recording dialog content for the mobile application.
 */
class StartRecordingDialogContent extends AbstractStartRecordingDialogContent {
    /**
     * Renders the component.
     *
     * @protected
     * @returns {React$Component}
     */
    override render() {
        const _renderRecording = this.props._renderRecording;

        return (
            <Container className = 'recording-dialog'>
                { _renderRecording && (
                    <>
                        { this._renderNoIntegrationsContent() }
                        { this._renderFileSharingContent() }
                        { this._renderUploadToTheCloudInfo() }
                        { this._renderIntegrationsContent() }
                    </>
                )}
                { this._renderLocalRecordingContent() }
                { _renderRecording && <> { this._renderAdvancedOptions() } </> }
            </Container>
        );
    }

    /**
     * Renders the switch for saving the transcription.
     *
     * @returns {React$Component}
     */
    _renderAdvancedOptions() {
        const { selectedRecordingService } = this.props;

        if (selectedRecordingService !== RECORDING_TYPES.JITSI_REC_SERVICE || !this._canStartTranscribing()) {
            return null;
        }

        const { showAdvancedOptions } = this.state;
        const { shouldRecordAudioAndVideo, shouldRecordTranscription, t } = this.props;

        return (
            <>
                <div className = 'recording-header-line' />
                <div
                    className = 'recording-header'
                    onClick = { this._onToggleShowOptions }>
                    <label className = 'recording-title-no-space'>
                        {t('recording.showAdvancedOptions')}
                    </label>
                    <Icon
                        ariaPressed = { showAdvancedOptions }
                        onClick = { this._onToggleShowOptions }
                        role = 'button'
                        size = { 24 }
                        src = { showAdvancedOptions ? IconArrowDown : IconArrowRight } />
                </div>
                {showAdvancedOptions && (
                    <>
                        <div className = 'recording-header space-top'>
                            <label
                                className = 'recording-title'
                                htmlFor = 'recording-switch-transcription'>
                                { t('recording.recordTranscription') }
                            </label>
                            <Switch
                                checked = { shouldRecordTranscription }
                                className = 'recording-switch'
                                id = 'recording-switch-transcription'
                                onChange = { this._onTranscriptionSwitchChange } />
                        </div>
                        <div className = 'recording-header space-top'>
                            <label
                                className = 'recording-title'
                                htmlFor = 'recording-switch-transcription'>
                                { t('recording.recordAudioAndVideo') }
                            </label>
                            <Switch
                                checked = { shouldRecordAudioAndVideo }
                                className = 'recording-switch'
                                id = 'recording-switch-transcription'
                                onChange = { this._onRecordAudioAndVideoSwitchChange } />
                        </div>
                    </>
                )}
            </>
        );
    }

    /**
     * Renders the content in case no integrations were enabled.
     *
     * @returns {React$Component}
     */
    _renderNoIntegrationsContent() {
        if (!this._shouldRenderNoIntegrationsContent()) {
            return null;
        }

        const {
            _localRecordingAvailable,
            integrationsEnabled,
            isValidating,
            isVpaas,
            selectedRecordingService,
            t
        } = this.props;

        const switchContent
            = integrationsEnabled || _localRecordingAvailable
                ? (
                    <Switch
                        checked = { selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE }
                        className = 'recording-switch'
                        disabled = { isValidating || !this.props.shouldRecordAudioAndVideo }
                        id = 'recording-switch-jitsi'
                        onChange = { this._onRecordingServiceSwitchChange } />
                ) : null;

        const label = isVpaas ? t('recording.serviceDescriptionCloud') : t('recording.serviceDescription');
        const jitsiContentRecordingIconContainer
            = integrationsEnabled || _localRecordingAvailable
                ? 'jitsi-content-recording-icon-container-with-switch'
                : 'jitsi-content-recording-icon-container-without-switch';
        const contentRecordingClass = isVpaas
            ? 'cloud-content-recording-icon-container'
            : jitsiContentRecordingIconContainer;
        const jitsiRecordingHeaderClass = !isVpaas && 'jitsi-recording-header';

        return (
            <Container
                className = { `recording-header ${jitsiRecordingHeaderClass}` }
                key = 'noIntegrationSetting'>
                <Container className = { contentRecordingClass }>
                    <Image
                        alt = ''
                        className = 'content-recording-icon'
                        src = { ICON_CLOUD } />
                </Container>
                <label
                    className = 'recording-title'
                    htmlFor = 'recording-switch-jitsi'>
                    { label }
                </label>
                { switchContent }
            </Container>
        );
    }

    /**
     * Renders the file recording service sharing options, if enabled.
     *
     * @returns {React$Component}
     */
    _renderFileSharingContent() {
        if (!this._shouldRenderFileSharingContent()) {
            return null;
        }

        const {
            isValidating,
            onSharingSettingChanged,
            sharingSetting,
            t
        } = this.props;

        return (
            <Container
                className = 'recording-header'
                key = 'fileSharingSetting'>
                <Container className = 'recording-icon-container file-sharing-icon-container'>
                    <Image
                        alt = ''
                        className = 'recording-file-sharing-icon'
                        src = { ICON_USERS } />
                </Container>
                <label
                    className = 'recording-title'
                    htmlFor = 'recording-switch-share'>
                    { t('recording.fileSharingdescription') }
                </label>
                <Switch
                    checked = { sharingSetting }
                    className = 'recording-switch'
                    disabled = { isValidating || !this.props.shouldRecordAudioAndVideo }
                    id = 'recording-switch-share'
                    onChange = { onSharingSettingChanged } />
            </Container>
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
            selectedRecordingService,
            t
        } = this.props;

        if (!(isVpaas && selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE) || _hideStorageWarning) {
            return null;
        }

        return (
            <Container
                className = 'recording-info'
                key = 'cloudUploadInfo'>
                <Image
                    alt = ''
                    className = 'recording-info-icon'
                    src = { ICON_INFO } />
                <Text className = 'recording-info-title'>
                    { t('recording.serviceDescriptionCloudInfo') }
                </Text>
            </Container>
        );
    }

    /**
     * Renders a spinner component.
     *
     * @returns {React$Component}
     */
    _renderSpinner() {
        return (
            <LoadingIndicator size = 'small' />
        );
    }

    /**
     * Renders the screen with the account information of a logged in user.
     *
     * @returns {React$Component}
     */
    _renderSignOut() {
        const {
            spaceLeft,
            t,
            userName
        } = this.props;
        const duration = getRecordingDurationEstimation(spaceLeft);

        return (
            <Container>
                <Container className = 'logged-in-panel'>
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
            </Container>
        );
    }

    /**
     * Renders the content in case integrations were enabled.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderIntegrationsContent() {
        if (!this._shouldRenderIntegrationsContent()) {
            return null;
        }

        const {
            _localRecordingAvailable,
            fileRecordingsServiceEnabled,
            isTokenValid,
            isValidating,
            selectedRecordingService,
            t
        } = this.props;
        let content = null;
        let switchContent = null;
        let labelContent = (
            <Text className = 'recording-title'>
                { t('recording.authDropboxText') }
            </Text>
        );

        if (isValidating) {
            content = this._renderSpinner();
            switchContent = <Container className = 'recording-switch' />;
        } else if (isTokenValid) {
            content = this._renderSignOut();
            switchContent = (
                <Container className = 'recording-switch'>
                    <Button
                        accessibilityLabel = { t('recording.signOut') }
                        labelKey = 'recording.signOut'
                        onClick = { this._onSignOut }
                        type = { BUTTON_TYPES.SECONDARY } />
                </Container>
            );

        } else {
            switchContent = (
                <Container className = 'recording-switch'>
                    <Button
                        accessibilityLabel = { t('recording.signIn') }
                        labelKey = 'recording.signIn'
                        onClick = { this._onSignIn }
                        type = { BUTTON_TYPES.PRIMARY } />
                </Container>
            );
        }

        if (fileRecordingsServiceEnabled || _localRecordingAvailable) {
            switchContent = (
                <Switch
                    checked = { selectedRecordingService
                        === RECORDING_TYPES.DROPBOX }
                    className = 'recording-switch'
                    disabled = { isValidating || !this.props.shouldRecordAudioAndVideo }
                    id = 'recording-switch-integration'
                    onChange = { this._onDropboxSwitchChange } />
            );
            labelContent = (
                <label
                    className = 'recording-title'
                    htmlFor = 'recording-switch-integration'>
                    { t('recording.authDropboxText') }
                </label>
            );
        }

        return (
            <Container>
                <Container
                    className = { `recording-header ${this._shouldRenderNoIntegrationsContent()
                        ? 'recording-header-line' : ''}` }>
                    <Container
                        className = 'recording-icon-container'>
                        <Image
                            alt = ''
                            className = 'recording-icon'
                            src = { DROPBOX_LOGO } />
                    </Container>
                    { labelContent }
                    { switchContent }
                </Container>
                <Container className = 'authorization-panel'>
                    { content }
                </Container>
            </Container>
        );
    }

    /**
     * Renders the content for local recordings.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderLocalRecordingContent() {
        const {
            _localRecordingAvailable,
            _localRecordingNoNotification,
            _localRecordingSelfEnabled,
            isValidating,
            localRecordingOnlySelf,
            onLocalRecordingSelfChange,
            t,
            selectedRecordingService
        } = this.props;

        if (!_localRecordingAvailable) {
            return null;
        }

        return (
            <>
                <Container>
                    <Container
                        className = 'recording-header recording-header-line'>
                        <Container
                            className = 'recording-icon-container'>
                            <Image
                                alt = ''
                                className = 'recording-icon'
                                src = { LOCAL_RECORDING } />
                        </Container>
                        <label
                            className = 'recording-title'
                            htmlFor = 'recording-switch-local'>
                            { t('recording.saveLocalRecording') }
                        </label>
                        <Switch
                            checked = { selectedRecordingService
                                === RECORDING_TYPES.LOCAL }
                            className = 'recording-switch'
                            disabled = { isValidating || !this.props.shouldRecordAudioAndVideo }
                            id = 'recording-switch-local'
                            onChange = { this._onLocalRecordingSwitchChange } />
                    </Container>
                </Container>
                {selectedRecordingService === RECORDING_TYPES.LOCAL && (
                    <>
                        {_localRecordingSelfEnabled && (
                            <Container>
                                <Container className = 'recording-header space-top'>
                                    <Container className = 'recording-icon-container file-sharing-icon-container'>
                                        <Image
                                            alt = ''
                                            className = 'recording-file-sharing-icon'
                                            src = { ICON_USERS } />
                                    </Container>
                                    <label
                                        className = 'recording-title'
                                        htmlFor = 'recording-switch-myself'>
                                        {t('recording.onlyRecordSelf')}
                                    </label>
                                    <Switch
                                        checked = { Boolean(localRecordingOnlySelf) }
                                        className = 'recording-switch'
                                        disabled = { isValidating || !this.props.shouldRecordAudioAndVideo }
                                        id = 'recording-switch-myself'
                                        onChange = { onLocalRecordingSelfChange ?? EMPTY_FUNCTION } />
                                </Container>
                            </Container>
                        )}
                        <Text className = 'local-recording-warning text'>
                            {t('recording.localRecordingWarning')}
                        </Text>
                        {_localRecordingNoNotification && !localRecordingOnlySelf
                            && <Text className = 'local-recording-warning notification'>
                                {t('recording.localRecordingNoNotificationWarning')}
                            </Text>
                        }
                    </>
                )}
            </>

        );
    }
}

export default translate(connect(mapStateToProps)(StartRecordingDialogContent));

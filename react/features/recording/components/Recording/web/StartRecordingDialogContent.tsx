/* eslint-disable lines-around-comment  */
import React from 'react';

import { translate } from '../../../../base/i18n/functions';
import {
    Container,
    Image,
    LoadingIndicator,
    Text
    // @ts-ignore
} from '../../../../base/react';
import { connect } from '../../../../base/redux/functions';
import Button from '../../../../base/ui/components/web/Button';
import Switch from '../../../../base/ui/components/web/Switch';
import { BUTTON_TYPES } from '../../../../base/ui/constants.web';
import { RECORDING_TYPES } from '../../../constants';
// @ts-ignore
import { getRecordingDurationEstimation } from '../../../functions';
import AbstractStartRecordingDialogContent, {
    IProps,
    mapStateToProps
} from '../AbstractStartRecordingDialogContent';
import {
    DROPBOX_LOGO,
    ICON_CLOUD,
    ICON_INFO,
    ICON_USERS,
    LOCAL_RECORDING
    // @ts-ignore
} from '../styles.web';


/**
 * The start recording dialog content for the mobile application.
 */
class StartRecordingDialogContent extends AbstractStartRecordingDialogContent<IProps> {
    /**
     * Renders the component.
     *
     * @protected
     * @returns {React$Component}
     */
    render() {
        return (
            <Container className = 'recording-dialog'>
                { this._renderNoIntegrationsContent() }
                { this._renderFileSharingContent() }
                { this._renderUploadToTheCloudInfo() }
                { this._renderIntegrationsContent() }
                { this._renderLocalRecordingContent() }
            </Container>
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
                        disabled = { isValidating }
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
                        className = 'content-recording-icon'
                        src = { ICON_CLOUD } />
                </Container>
                <Text className = 'recording-title'>
                    { label }
                </Text>
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
            // @ts-ignore
        } = this.props;

        return (
            <Container
                className = 'recording-header'
                key = 'fileSharingSetting'>
                <Container className = 'recording-icon-container file-sharing-icon-container'>
                    <Image
                        className = 'recording-file-sharing-icon'
                        src = { ICON_USERS } />
                </Container>
                <Text className = 'recording-title'>
                    { t('recording.fileSharingdescription') }
                </Text>
                <Switch
                    checked = { sharingSetting }
                    className = 'recording-switch'
                    disabled = { isValidating }
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
            <LoadingIndicator
                isCompleting = { false }
                size = 'small' />
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
                    disabled = { isValidating }
                    onChange = { this._onDropboxSwitchChange } />
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
                            className = 'recording-icon'
                            src = { DROPBOX_LOGO } />
                    </Container>
                    <Text className = 'recording-title'>
                        { t('recording.authDropboxText') }
                    </Text>
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
                                className = 'recording-icon'
                                src = { LOCAL_RECORDING } />
                        </Container>
                        <Text className = 'recording-title'>
                            { t('recording.saveLocalRecording') }
                        </Text>
                        <Switch
                            checked = { selectedRecordingService
                                === RECORDING_TYPES.LOCAL }
                            className = 'recording-switch'
                            disabled = { isValidating }
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
                                            className = 'recording-file-sharing-icon'
                                            src = { ICON_USERS } />
                                    </Container>
                                    <Text className = 'recording-title'>
                                        {t('recording.onlyRecordSelf')}
                                    </Text>
                                    <Switch
                                        checked = { localRecordingOnlySelf }
                                        className = 'recording-switch'
                                        disabled = { isValidating }
                                        onChange = { onLocalRecordingSelfChange } />
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

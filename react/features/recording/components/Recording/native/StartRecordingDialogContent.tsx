import React from 'react';
import { Image, View } from 'react-native';
import { Text } from 'react-native-paper';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import LoadingIndicator from '../../../../base/react/components/native/LoadingIndicator';
import Button from '../../../../base/ui/components/native/Button';
import Switch from '../../../../base/ui/components/native/Switch';
import { BUTTON_TYPES } from '../../../../base/ui/constants.native';
import { RECORDING_TYPES } from '../../../constants';
import { getRecordingDurationEstimation } from '../../../functions';
import AbstractStartRecordingDialogContent, {
    IProps,
    mapStateToProps
} from '../AbstractStartRecordingDialogContent';
import {
    DROPBOX_LOGO,
    ICON_CLOUD,
    ICON_INFO,
    ICON_USERS
} from '../styles.native';


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
        const { _styles: styles } = this.props;

        return (
            <View style = { styles.container }>
                { this._renderNoIntegrationsContent() }
                { this._renderFileSharingContent() }
                { this._renderUploadToTheCloudInfo() }
                { this._renderIntegrationsContent() }
            </View>
        );
    }

    /**
     * Renders the content in case no integrations were enabled.
     *
     * @returns {React$Component}
     */
    _renderNoIntegrationsContent() {
        const {
            _dialogStyles,
            _styles: styles,
            integrationsEnabled,
            isValidating,
            selectedRecordingService,
            t
        } = this.props;

        if (!this._shouldRenderNoIntegrationsContent()) {
            return null;
        }

        const switchContent
            = integrationsEnabled
                ? (
                    <Switch
                        checked = { selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE }
                        disabled = { isValidating }
                        onChange = { this._onRecordingServiceSwitchChange }
                        style = { styles.switch } />
                ) : null;

        return (
            <View
                key = 'noIntegrationSetting'
                style = { styles.header }>
                <Image
                    source = { ICON_CLOUD }
                    style = { styles.recordingIcon } />
                <Text
                    style = {{
                        ..._dialogStyles.text,
                        ...styles.title
                    }}>
                    { t('recording.serviceDescription') }
                </Text>
                { switchContent }
            </View>
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
            _dialogStyles,
            _styles: styles,
            isValidating,
            onSharingSettingChanged,
            sharingSetting,
            t
        } = this.props;

        return (
            <View
                key = 'fileSharingSetting'
                style = { styles.header }>
                <Image
                    source = { ICON_USERS }
                    style = { styles.recordingIcon } />
                <Text
                    style = {{
                        ..._dialogStyles.text,
                        ...styles.title
                    }}>
                    { t('recording.fileSharingdescription') }
                </Text>
                <Switch
                    checked = { sharingSetting }
                    disabled = { isValidating }
                    onChange = { onSharingSettingChanged }
                    style = { styles.switch } />
            </View>
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
            selectedRecordingService,
            t
        } = this.props;

        if (!(isVpaas && selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE) || _hideStorageWarning) {
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
     * Renders a spinner component.
     *
     * @returns {React$Component}
     */
    _renderSpinner() {
        return (
            <LoadingIndicator
                size = 'small' />
        );
    }

    /**
     * Renders the screen with the account information of a logged in user.
     *
     * @returns {React$Component}
     */
    _renderSignOut() {
        const { _styles: styles, spaceLeft, t, userName } = this.props;
        const duration = getRecordingDurationEstimation(spaceLeft);

        return (
            <View
                style = { styles.loggedIn }>
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
            _dialogStyles,
            _styles: styles,
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
            switchContent = <View />;
        } else if (isTokenValid) {
            content = this._renderSignOut();
            switchContent = (
                <Button
                    accessibilityLabel = 'recording.signOut'
                    labelKey = 'recording.signOut'
                    onClick = { this._onSignOut }
                    type = { BUTTON_TYPES.SECONDARY } />
            );

        } else {
            switchContent = (
                <Button
                    accessibilityLabel = 'recording.signIn'
                    labelKey = 'recording.signIn'
                    onClick = { this._onSignIn }
                    type = { BUTTON_TYPES.PRIMARY } />
            );
        }

        if (fileRecordingsServiceEnabled) {
            switchContent = (
                <Switch
                    checked = { selectedRecordingService === RECORDING_TYPES.DROPBOX }
                    disabled = { isValidating }
                    onChange = { this._onDropboxSwitchChange }
                    style = { styles.switch } />
            );
        }

        return (
            <View>
                <View
                    style = { styles.headerIntegrations }>
                    <Image
                        source = { DROPBOX_LOGO }
                        style = { styles.recordingIcon } />
                    <Text
                        style = {{
                            ..._dialogStyles.text,
                            ...styles.title
                        }}>
                        { t('recording.authDropboxText') }
                    </Text>
                    { switchContent }
                </View>
                <View>
                    { content }
                </View>
            </View>
        );
    }
}

export default translate(connect(mapStateToProps)(StartRecordingDialogContent));

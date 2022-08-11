/* eslint-disable lines-around-comment  */
import React from 'react';
import { Image, View } from 'react-native';
import { Switch, Text } from 'react-native-paper';

// @ts-ignore
import { translate } from '../../../../base/i18n';
// @ts-ignore
import { LoadingIndicator } from '../../../../base/react';
// @ts-ignore
import { connect } from '../../../../base/redux';
import Button from '../../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../../base/ui/constants';
// @ts-ignore
import { RECORDING_TYPES } from '../../../constants';
// @ts-ignore
import { getRecordingDurationEstimation } from '../../../functions';
import AbstractStartRecordingDialogContent, {
    type Props,
    mapStateToProps
} from '../AbstractStartRecordingDialogContent';
import {
    DROPBOX_LOGO,
    ICON_CLOUD,
    ICON_INFO,
    ICON_USERS,
    TRACK_COLOR
    // @ts-ignore
} from '../styles.native';


/**
 * The start recording dialog content for the mobile application.
 */
class StartRecordingDialogContent extends
// @ts-ignore
    AbstractStartRecordingDialogContent<Props> {
    /**
     * Renders the component.
     *
     * @protected
     * @returns {React$Component}
     */
    render() {
        // @ts-ignore
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

    _shouldRenderNoIntegrationsContent: () => boolean;

    _onRecordingServiceSwitchChange: () => void;


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
            // @ts-ignore
        } = this.props;

        if (!this._shouldRenderNoIntegrationsContent()) {
            return null;
        }

        const switchContent
            = integrationsEnabled
                ? (
                    <Switch
                        disabled = { isValidating }
                        onValueChange = { this._onRecordingServiceSwitchChange }
                        style = { styles.switch }
                        trackColor = {{ false: TRACK_COLOR }}
                        value = { selectedRecordingService === RECORDING_TYPES.JITSI_REC_SERVICE } />
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

    _shouldRenderFileSharingContent: () => boolean;

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
            // @ts-ignore
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
                    disabled = { isValidating }
                    onValueChange
                        = { onSharingSettingChanged }
                    style = { styles.switch }
                    trackColor = {{ false: TRACK_COLOR }}
                    value = { sharingSetting } />
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
            // @ts-ignore
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
        // @ts-ignore
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

    _shouldRenderIntegrationsContent: () => boolean;

    _onSignIn: () => void;

    _onSignOut: () => void;

    _onDropboxSwitchChange: () => void;

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
            // @ts-ignore
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
                    label = 'recording.signOut'
                    onPress = { this._onSignOut }
                    type = { BUTTON_TYPES.SECONDARY } />
            );

        } else {
            switchContent = (
                <Button
                    accessibilityLabel = 'recording.signIn'
                    label = 'recording.signIn'
                    onPress = { this._onSignIn }
                    type = { BUTTON_TYPES.PRIMARY } />
            );
        }

        if (fileRecordingsServiceEnabled) {
            switchContent = (
                <Switch
                    disabled = { isValidating }
                    onValueChange = { this._onDropboxSwitchChange }
                    style = { styles.switch }
                    trackColor = {{ false: TRACK_COLOR }}
                    value = { selectedRecordingService
                        === RECORDING_TYPES.DROPBOX } />
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

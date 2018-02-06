// @flow

import React from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { getSafetyOffset, isIPad } from '../../base/react';
import { ASPECT_RATIO_NARROW } from '../../base/responsive-ui';

import { _mapStateToProps, AbstractAppSettings } from './AbstractAppSettings';
import { hideAppSettings } from '../actions';
import BackButton from './BackButton.native';
import FormRow from './FormRow.native';
import FormSectionHeader from './FormSectionHeader.native';
import { normalizeUserInputURL } from '../functions';
import styles, { HEADER_PADDING } from './styles';

/**
 * The native container rendering the app settings page.
 *
 * @extends AbstractAppSettings
 */
class AppSettings extends AbstractAppSettings {
    _urlField: Object;

    /**
     * Instantiates a new {@code AppSettings} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._getSafetyPadding = this._getSafetyPadding.bind(this);
        this._onBlurServerURL = this._onBlurServerURL.bind(this);
        this._onRequestClose = this._onRequestClose.bind(this);
        this._setURLFieldReference = this._setURLFieldReference.bind(this);
        this._showURLAlert = this._showURLAlert.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}, renders the settings page.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _profile, t } = this.props;

        // FIXME: presentationStyle is added to workaround orientation issue on
        // iOS

        return (
            <Modal
                animationType = 'slide'
                onRequestClose = { this._onRequestClose }
                presentationStyle = 'overFullScreen'
                supportedOrientations = { [
                    'landscape',
                    'portrait'
                ] }
                visible = { this.props._visible }>
                <View
                    style = { [
                        styles.headerContainer,
                        this._getSafetyPadding()
                    ] } >
                    <BackButton
                        onPress = { this._onRequestClose }
                        style = { styles.settingsBackButton } />
                    <Text style = { [ styles.text, styles.headerTitle ] } >
                        { t('profileModal.header') }
                    </Text>
                </View>
                <ScrollView style = { styles.settingsContainer } >
                    <FormSectionHeader
                        i18nLabel = 'profileModal.profileSection' />
                    <FormRow
                        fieldSeparator = { true }
                        i18nLabel = 'profileModal.displayName' >
                        <TextInput
                            onChangeText = { this._onChangeDisplayName }
                            placeholder = 'John Doe'
                            value = { _profile.displayName } />
                    </FormRow>
                    <FormRow
                        i18nLabel = 'profileModal.email' >
                        <TextInput
                            keyboardType = { 'email-address' }
                            onChangeText = { this._onChangeEmail }
                            placeholder = 'email@example.com'
                            value = { _profile.email } />
                    </FormRow>
                    <FormSectionHeader
                        i18nLabel = 'profileModal.conferenceSection' />
                    <FormRow
                        fieldSeparator = { true }
                        i18nLabel = 'profileModal.serverURL' >
                        <TextInput
                            autoCapitalize = 'none'
                            onBlur = { this._onBlurServerURL }
                            onChangeText = { this._onChangeServerURL }
                            placeholder = { this.props._serverURL }
                            ref = { this._setURLFieldReference }
                            value = { _profile.serverURL } />
                    </FormRow>
                    <FormRow
                        fieldSeparator = { true }
                        i18nLabel = 'profileModal.startWithAudioMuted' >
                        <Switch
                            onValueChange = {
                                this._onStartAudioMutedChange
                            }
                            value = {
                                _profile.startWithAudioMuted
                            } />
                    </FormRow>
                    <FormRow
                        i18nLabel = 'profileModal.startWithVideoMuted' >
                        <Switch
                            onValueChange = {
                                this._onStartVideoMutedChange
                            }
                            value = {
                                _profile.startWithVideoMuted
                            } />
                    </FormRow>
                </ScrollView>
            </Modal>
        );
    }

    _getSafetyPadding: () => Object;

    /**
     * Calculates header safety padding for mobile devices. See comment in
     * functions.js.
     *
     * @private
     * @returns {Object}
     */
    _getSafetyPadding() {
        if (isIPad() || this.props._aspectRatio === ASPECT_RATIO_NARROW) {
            const safeOffset = Math.max(getSafetyOffset(), HEADER_PADDING);

            return {
                paddingTop: safeOffset
            };
        }

        return undefined;
    }

    _onBlurServerURL: () => void;

    /**
     * Handler the server URL lose focus event. Here we validate the server URL
     * and update it to the normalized version, or show an error if incorrect.
     *
     * @private
     * @returns {void}
     */
    _onBlurServerURL() {
        this._processServerURL(false /* hideOnSuccess */);
    }

    _onChangeDisplayName: (string) => void;

    _onChangeEmail: (string) => void;

    _onChangeServerURL: (string) => void;

    _onStartAudioMutedChange: (boolean) => void;

    _onStartVideoMutedChange: (boolean) => void;

    _onRequestClose: () => void;

    /**
     * Processes the server URL. It normalizes it and an error alert is
     * displayed in case it's incorrect.
     *
     * @param {boolean} hideOnSuccess - True if the dialog should be hidden if
     * normalization / validation succeeds, false otherwise.
     * @private
     * @returns {void}
     */
    _processServerURL(hideOnSuccess: boolean) {
        const { serverURL } = this.props._profile;
        const normalizedURL = normalizeUserInputURL(serverURL);

        if (normalizedURL === null) {
            this._showURLAlert();
        } else {
            this._onChangeServerURL(normalizedURL);
            if (hideOnSuccess) {
                this.props.dispatch(hideAppSettings());
            }
        }
    }

    /**
     * Handles the back button.
     * Also invokes normalizeUserInputURL to validate the URL entered
     * by the user.
     *
     * @returns {void}
     */
    _onRequestClose() {
        this._processServerURL(true /* hideOnSuccess */);
    }

    _setURLFieldReference: (React$ElementRef<*> | null) => void;

    /**
     *  Stores a reference to the URL field for later use.
     *
     * @protected
     * @param {Object} component - The field component.
     * @returns {void}
     */
    _setURLFieldReference(component) {
        this._urlField = component;
    }

    _showURLAlert: () => void;

    /**
     * Shows an alert telling the user that the URL he/she entered was invalid.
     *
     * @returns {void}
     */
    _showURLAlert() {
        const { t } = this.props;

        Alert.alert(
            t('profileModal.alertTitle'),
            t('profileModal.alertURLText'),
            [
                {
                    onPress: () => this._urlField.focus(),
                    text: t('profileModal.alertOk')
                }
            ]
        );
    }
}

export default translate(connect(_mapStateToProps)(AppSettings));

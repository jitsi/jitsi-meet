// @flow

import React from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { Header } from '../../base/react';
import { PlatformElements } from '../../base/styles';

import { hideAppSettings } from '../actions';
import { normalizeUserInputURL } from '../functions';

import { BackButton, FormRow, FormSectionHeader } from './_';
import { _mapStateToProps, AbstractAppSettings } from './AbstractAppSettings';
import styles from './styles';

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

        return (
            <Modal
                animationType = 'slide'
                onRequestClose = { this._onRequestClose }
                presentationStyle = 'fullScreen'
                supportedOrientations = { [
                    'landscape',
                    'portrait'
                ] }
                visible = { this.props._visible }>
                <View style = { PlatformElements.page }>
                    <Header>
                        <BackButton
                            onPress = { this._onRequestClose } />
                        <Text
                            style = { [
                                styles.text,
                                PlatformElements.headerText
                            ] } >
                            { t('settingsScreen.header') }
                        </Text>
                    </Header>
                    <SafeAreaView style = { styles.settingsForm }>
                        <ScrollView>
                            <FormSectionHeader
                                i18nLabel = 'settingsScreen.profileSection' />
                            <FormRow
                                fieldSeparator = { true }
                                i18nLabel = 'settingsScreen.displayName' >
                                <TextInput
                                    onChangeText = { this._onChangeDisplayName }
                                    placeholder = 'John Doe'
                                    value = { _profile.displayName } />
                            </FormRow>
                            <FormRow
                                i18nLabel = 'settingsScreen.email' >
                                <TextInput
                                    keyboardType = { 'email-address' }
                                    onChangeText = { this._onChangeEmail }
                                    placeholder = 'email@example.com'
                                    value = { _profile.email } />
                            </FormRow>
                            <FormSectionHeader
                                i18nLabel
                                    = 'settingsScreen.conferenceSection' />
                            <FormRow
                                fieldSeparator = { true }
                                i18nLabel = 'settingsScreen.serverURL' >
                                <TextInput
                                    autoCapitalize = 'none'
                                    onBlur = { this._onBlurServerURL }
                                    onChangeText = { this._onChangeServerURL }
                                    placeholder = { this.props._serverURL }
                                    value = { _profile.serverURL } />
                            </FormRow>
                            <FormRow
                                fieldSeparator = { true }
                                i18nLabel
                                    = 'settingsScreen.startWithAudioMuted' >
                                <Switch
                                    onValueChange = {
                                        this._onStartAudioMutedChange
                                    }
                                    value = {
                                        _profile.startWithAudioMuted
                                    } />
                            </FormRow>
                            <FormRow
                                i18nLabel
                                    = 'settingsScreen.startWithVideoMuted' >
                                <Switch
                                    onValueChange = {
                                        this._onStartVideoMutedChange
                                    }
                                    value = {
                                        _profile.startWithVideoMuted
                                    } />
                            </FormRow>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </Modal>
        );
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

    _onRequestClose: () => void;

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
            t('settingsScreen.alertTitle'),
            t('settingsScreen.alertURLText'),
            [
                {
                    onPress: () => this._urlField.focus(),
                    text: t('settingsScreen.alertOk')
                }
            ]
        );
    }
}

export default translate(connect(_mapStateToProps)(AppSettings));

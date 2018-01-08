import React from 'react';
import {
    Modal,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View } from 'react-native';
import { connect } from 'react-redux';

import {
    _mapStateToProps,
    AbstractAppSettings
} from './AbstractAppSettings';
import BackButton from './BackButton';
import FormRow from './FormRow';
import FormSectionHeader from './FormSectionHeader';
import styles, { HEADER_PADDING } from './styles';

import { getSafetyOffset } from '../functions.native';

import { ASPECT_RATIO_NARROW } from '../../base/aspect-ratio';
import { translate } from '../../base/i18n';
import { isIPad } from '../../base/react';

/**
 * The native container rendering the app settings page.
 *
 * @extends AbstractAppSettings
 */
class AppSettings extends AbstractAppSettings {
    /**
    * Instantiates a new {@code AppSettings} instance.
    *
    * @inheritdoc
    */
    constructor(props) {
        super(props);

        this._getSafetyPadding = this._getSafetyPadding.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}, renders the settings page.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _profile, t } = this.props;

        // FIXME: presentationStyle is added to workaround
        // orientation issue on iOS

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
                            onChangeText = { this._onChangeServerURL }
                            placeholder = { this.props._serverURL }
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

    /**
    * Calculates header safety padding for mobile devices.
    * See comment in functions.js.
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
}

export default translate(connect(_mapStateToProps)(AppSettings));

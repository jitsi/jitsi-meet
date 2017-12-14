import React from 'react';
import {
    Modal,
    Switch,
    Text,
    TextInput,
    View } from 'react-native';
import { connect } from 'react-redux';

import {
    _mapStateToProps,
    AbstractAppSettings
} from './AbstractAppSettings';
import FormRow from './FormRow';
import styles from './styles';

import { translate } from '../../base/i18n';

/**
 * The native container rendering the app settings page.
 *
 * @extends AbstractAppSettings
 */
class AppSettings extends AbstractAppSettings {

    /**
     * Implements React's {@link Component#render()}, renders the settings page.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <Modal
                animationType = 'slide'
                onRequestClose = { this._onRequestClose }
                presentationStyle = 'fullScreen'
                style = { styles.modal }
                visible = { this.props._visible }>
                <View style = { styles.headerContainer } >
                    <Text style = { [ styles.text, styles.headerTitle ] } >
                        { t('profileModal.header') }
                    </Text>
                </View>
                <View style = { styles.settingsContainer } >
                    <FormRow
                        fieldSeparator = { true }
                        i18nLabel = 'profileModal.serverURL' >
                        <TextInput
                            autoCapitalize = 'none'
                            onChangeText = { this._onChangeServerName }
                            onEndEditing = { this._onSaveServerName }
                            placeholder = 'https://jitsi.example.com'
                            value = { this.state.serverURL } />
                    </FormRow>
                    <FormRow
                        fieldSeparator = { true }
                        i18nLabel = 'profileModal.displayName' >
                        <TextInput
                            onChangeText = { this._onChangeDisplayName }
                            onEndEditing = { this._onSaveDisplayName }
                            placeholder = 'John Doe'
                            value = { this.state.displayName } />
                    </FormRow>
                    <FormRow
                        fieldSeparator = { true }
                        i18nLabel = 'profileModal.email' >
                        <TextInput
                            onChangeText = { this._onChangeEmail }
                            onEndEditing = { this._onSaveEmail }
                            placeholder = 'email@example.com'
                            value = { this.state.email } />
                    </FormRow>
                    <FormRow
                        fieldSeparator = { true }
                        i18nLabel = 'profileModal.startWithAudioMuted' >
                        <Switch
                            onValueChange = {
                                this._onStartAudioMutedChange
                            }
                            value = { this.state.startWithAudioMuted } />
                    </FormRow>
                    <FormRow
                        i18nLabel = 'profileModal.startWithVideoMuted' >
                        <Switch
                            onValueChange = {
                                this._onStartVideoMutedChange
                            }
                            value = { this.state.startWithVideoMuted } />
                    </FormRow>
                </View>
            </Modal>
        );
    }
}

export default translate(connect(_mapStateToProps)(AppSettings));

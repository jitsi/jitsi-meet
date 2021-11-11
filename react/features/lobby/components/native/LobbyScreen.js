// @flow

import React from 'react';
import { Text, View, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n';
import { Icon, IconEdit } from '../../../base/icons';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { LoadingIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import AbstractLobbyScreen, { _mapStateToProps } from '../AbstractLobbyScreen';

import styles from './styles';

/**
 * Implements a waiting screen that represents the participant being in the lobby.
 */
class LobbyScreen extends AbstractLobbyScreen {
    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _meetingName, t } = this.props;

        return (
            <JitsiScreen
                style = { styles.contentWrapper }>
                <SafeAreaView>
                    <Text style = { styles.dialogTitle }>
                        { t(this._getScreenTitleKey()) }
                    </Text>
                    <Text style = { styles.secondaryText }>
                        { _meetingName }
                    </Text>
                    { this._renderContent() }
                </SafeAreaView>
            </JitsiScreen>
        );
    }

    _getScreenTitleKey: () => string;

    _onAskToJoin: () => void;

    _onCancel: () => boolean;

    _onChangeDisplayName: Object => void;

    _onChangeEmail: Object => void;

    _onChangePassword: Object => void;

    _onEnableEdit: () => void;

    _onJoinWithPassword: () => void;

    _onSwitchToKnockMode: () => void;

    _onSwitchToPasswordMode: () => void;

    _renderContent: () => React$Element<*>;

    /**
     * Renders the joining (waiting) fragment of the screen.
     *
     * @inheritdoc
     */
    _renderJoining() {
        return (
            <>
                <LoadingIndicator
                    color = 'black'
                    style = { styles.loadingIndicator } />
                <Text style = { styles.joiningMessage }>
                    { this.props.t('lobby.joiningMessage') }
                </Text>
                { this._renderStandardButtons() }
            </>
        );
    }

    /**
     * Renders the participant form to let the knocking participant enter its details.
     *
     * @inheritdoc
     */
    _renderParticipantForm() {
        const { t } = this.props;
        const { displayName, email } = this.state;

        return (
            <View style = { styles.formWrapper }>
                <Text style = { styles.fieldLabel }>
                    { t('lobby.nameField') }
                </Text>
                <TextInput
                    onChangeText = { this._onChangeDisplayName }
                    style = { styles.field }
                    value = { displayName } />
                <Text style = { styles.fieldLabel }>
                    { t('lobby.emailField') }
                </Text>
                <TextInput
                    onChangeText = { this._onChangeEmail }
                    style = { styles.field }
                    value = { email } />
            </View>
        );
    }

    /**
     * Renders the participant info fragment when we have all the required details of the user.
     *
     * @inheritdoc
     */
    _renderParticipantInfo() {
        const { displayName, email } = this.state;

        return (
            <View style = { styles.participantBox }>
                <TouchableOpacity
                    onPress = { this._onEnableEdit }
                    style = { styles.editButton }>
                    <Icon
                        src = { IconEdit }
                        style = { styles.editIcon } />
                </TouchableOpacity>
                <Avatar
                    participantId = { this.props._participantId }
                    size = { 64 } />
                <Text style = { styles.displayNameText }>
                    { displayName }
                </Text>
                { Boolean(email) && <Text style = { styles.secondaryText }>
                    { email }
                </Text> }
            </View>
        );
    }

    /**
     * Renders the password form to let the participant join by using a password instead of knocking.
     *
     * @inheritdoc
     */
    _renderPasswordForm() {
        const { _passwordJoinFailed, t } = this.props;

        return (
            <View style = { styles.formWrapper }>
                <Text style = { styles.fieldLabel }>
                    { this.props.t('lobby.passwordField') }
                </Text>
                <TextInput
                    autoCapitalize = 'none'
                    autoCompleteType = 'off'
                    onChangeText = { this._onChangePassword }
                    secureTextEntry = { true }
                    style = { styles.field }
                    value = { this.state.password } />
                { _passwordJoinFailed && <Text style = { styles.fieldError }>
                    { t('lobby.invalidPassword') }
                </Text> }
            </View>
        );
    }

    /**
     * Renders the password join button (set).
     *
     * @inheritdoc
     */
    _renderPasswordJoinButtons() {
        const { t } = this.props;

        return (
            <>
                <TouchableOpacity
                    disabled = { !this.state.password }
                    onPress = { this._onJoinWithPassword }
                    style = { [
                        styles.button,
                        styles.primaryButton
                    ] }>
                    <Text style = { styles.primaryButtonText }>
                        { t('lobby.passwordJoinButton') }
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress = { this._onSwitchToKnockMode }
                    style = { [
                        styles.button,
                        styles.secondaryButton
                    ] }>
                    <Text>
                        { t('lobby.backToKnockModeButton') }
                    </Text>
                </TouchableOpacity>
            </>
        );
    }

    /**
     * Renders the standard button set.
     *
     * @inheritdoc
     */
    _renderStandardButtons() {
        const { _knocking, _renderPassword, t } = this.props;

        return (
            <>
                { _knocking || <TouchableOpacity
                    disabled = { !this.state.displayName }
                    onPress = { this._onAskToJoin }
                    style = { [
                        styles.button,
                        styles.primaryButton
                    ] }>
                    <Text style = { styles.primaryButtonText }>
                        { t('lobby.knockButton') }
                    </Text>
                </TouchableOpacity> }
                { _renderPassword && <TouchableOpacity
                    onPress = { this._onSwitchToPasswordMode }
                    style = { [
                        styles.button,
                        styles.secondaryButton
                    ] }>
                    <Text>
                        { t('lobby.enterPasswordButton') }
                    </Text>
                </TouchableOpacity> }
                <TouchableOpacity
                    onPress = { this._onCancel }
                    style = { styles.cancelButton }>
                    <Text>
                        { t('dialog.Cancel') }
                    </Text>
                </TouchableOpacity>
            </>
        );
    }
}

export default translate(connect(_mapStateToProps)(LobbyScreen));

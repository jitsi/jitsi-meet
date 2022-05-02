// @flow

import React from 'react';
import { Text, View, TouchableOpacity, TextInput } from 'react-native';

import { translate } from '../../../base/i18n';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { LoadingIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui';
import BaseTheme from '../../../base/ui/components/BaseTheme';
import InviteButton
    from '../../../invite/components/add-people-dialog/native/InviteButton';
import { LargeVideo } from '../../../large-video/components';
import HeaderNavigationButton
    from '../../../mobile/navigation/components/HeaderNavigationButton';
import { navigate }
    from '../../../mobile/navigation/components/lobby/LobbyNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import AudioMuteButton from '../../../toolbox/components/AudioMuteButton';
import VideoMuteButton from '../../../toolbox/components/VideoMuteButton';
import AbstractLobbyScreen, {
    Props as AbstractProps,
    _mapStateToProps as abstractMapStateToProps } from '../AbstractLobbyScreen';

import styles from './styles';


type Props = AbstractProps & {

    /**
     * The current aspect ratio of the screen.
     */
    _aspectRatio: Symbol
}

/**
 * Implements a waiting screen that represents the participant being in the lobby.
 */
class LobbyScreen extends AbstractLobbyScreen<Props> {
    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const { navigation, t } = this.props;

        navigation.setOptions({
            headerLeft: () => (
                <HeaderNavigationButton
                    label = { t('dialog.Cancel') }
                    onPress = { this._onCancel } />
            )
        });
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _aspectRatio } = this.props;
        let contentStyles;
        let largeVideoContainerStyles;
        let contentContainerStyles;

        if (_aspectRatio === ASPECT_RATIO_NARROW) {
            largeVideoContainerStyles = styles.largeVideoContainer;
            contentContainerStyles = styles.contentContainer;
        } else {
            contentStyles = styles.contentWide;
            largeVideoContainerStyles = styles.largeVideoContainerWide;
            contentContainerStyles = styles.contentContainerWide;
        }

        return (
            <JitsiScreen
                safeAreaInsets = { [ 'right' ] }
                style = { styles.contentWrapper }>
                <View style = { contentStyles }>
                    <View style = { largeVideoContainerStyles }>
                        <LargeVideo />
                    </View>
                    <View style = { contentContainerStyles }>
                        { this._renderContent() }
                        { this._renderToolbarButtons() }
                    </View>
                </View>
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

    _renderToolbarButtons: () => React$Element<*>;

    _onNavigateToLobbyChat: () => void;

    /**
     * Navigates to the lobby chat screen.
     *
     * @private
     * @returns {void}
     */
    _onNavigateToLobbyChat() {
        navigate(screen.lobby.chat);
    }

    /**
     * Renders the joining (waiting) fragment of the screen.
     *
     * @inheritdoc
     */
    _renderJoining() {
        return (
            <View style = { styles.formWrapper }>
                <LoadingIndicator
                    color = { BaseTheme.palette.icon01 }
                    style = { styles.loadingIndicator } />
                <Text style = { styles.joiningMessage }>
                    { this.props.t('lobby.joiningMessage') }
                </Text>
                { this._renderStandardButtons() }
            </View>
        );
    }

    /**
     * Renders the participant form to let the knocking participant enter its details.
     *
     * @inheritdoc
     */
    _renderParticipantForm() {
        const { t } = this.props;
        const { displayName } = this.state;

        return (
            <View style = { styles.formWrapper }>
                <Text style = { styles.fieldLabel }>
                    { t('lobby.nameField') }
                </Text>
                <TextInput
                    onChangeText = { this._onChangeDisplayName }
                    style = { styles.field }
                    value = { displayName } />
            </View>
        );
    }

    /**
     * Renders the participant info fragment when we have all the required details of the user.
     *
     * @inheritdoc
     */
    _renderParticipantInfo() {
        return this._renderParticipantForm();
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
            <View style = { styles.passwordJoinButtonsWrapper }>
                <TouchableOpacity
                    onPress = { this._onSwitchToKnockMode }
                    style = { [
                        styles.button,
                        styles.primaryButton
                    ] }>
                    <Text style = { styles.primaryButtonText }>
                        { t('lobby.backToKnockModeButton') }
                    </Text>
                </TouchableOpacity>
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
            </View>
        );
    }

    /**
     * Renders the toolbar buttons menu.
     *
     * @inheritdoc
     */
    _renderToolbarButtons() {
        const { _aspectRatio } = this.props;
        let toolboxContainerStyles;

        if (_aspectRatio === ASPECT_RATIO_NARROW) {
            toolboxContainerStyles = styles.toolboxContainer;
        } else {
            toolboxContainerStyles = styles.toolboxContainerWide;
        }

        return (
            <View style = { toolboxContainerStyles }>
                <AudioMuteButton
                    styles = { styles.buttonStylesBorderless } />
                <VideoMuteButton
                    styles = { styles.buttonStylesBorderless } />
                <InviteButton
                    styles = { styles.buttonStylesBorderless } />
            </View>
        );
    }

    /**
     * Renders the standard button set.
     *
     * @inheritdoc
     */
    _renderStandardButtons() {
        const { _knocking, _renderPassword, _isLobbyChatActive, t } = this.props;
        const { displayName } = this.state;
        const askToJoinButtonStyles
            = displayName ? styles.primaryButton : styles.primaryButtonDisabled;

        return (
            <View style = { styles.standardButtonWrapper }>
                { _knocking && _isLobbyChatActive && <TouchableOpacity
                    onPress = { this._onNavigateToLobbyChat }
                    style = { [
                        styles.button,
                        styles.primaryButton
                    ] }>
                    <Text style = { styles.primaryButtonText }>
                        { t('toolbar.openChat') }
                    </Text>
                </TouchableOpacity>}
                { _knocking || <TouchableOpacity
                    disabled = { !displayName }
                    onPress = { this._onAskToJoin }
                    style = { [
                        styles.button,
                        askToJoinButtonStyles
                    ] }>
                    <Text style = { styles.primaryButtonText }>
                        { t('lobby.knockButton') }
                    </Text>
                </TouchableOpacity> }
                { _renderPassword && <TouchableOpacity
                    onPress = { this._onSwitchToPasswordMode }
                    style = { [
                        styles.button,
                        styles.primaryButton
                    ] }>
                    <Text style = { styles.primaryButtonText }>
                        { t('lobby.enterPasswordButton') }
                    </Text>
                </TouchableOpacity> }
            </View>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {{
 *     _aspectRatio: Symbol
 * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    return {
        ...abstractMapStateToProps(state, ownProps),
        _aspectRatio: state['features/base/responsive-ui'].aspectRatio
    };
}

export default translate(connect(_mapStateToProps)(LobbyScreen));

import React from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getConferenceName } from '../../../base/conference/functions';
import { translate } from '../../../base/i18n/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import BrandingImageBackground from '../../../dynamic-branding/components/native/BrandingImageBackground';
import LargeVideo from '../../../large-video/components/LargeVideo.native';
import { navigate }
    from '../../../mobile/navigation/components/lobby/LobbyNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { preJoinStyles } from '../../../prejoin/components/native/styles';
import AudioMuteButton from '../../../toolbox/components/native/AudioMuteButton';
import VideoMuteButton from '../../../toolbox/components/native/VideoMuteButton';
import AbstractLobbyScreen, {
    IProps as AbstractProps,
    _mapStateToProps as abstractMapStateToProps } from '../AbstractLobbyScreen';

import styles from './styles';

interface IProps extends AbstractProps {

    /**
     * The current aspect ratio of the screen.
     */
    _aspectRatio: Symbol;

    /**
     * The room name.
     */
    _roomName: string;
}

/**
 * Implements a waiting screen that represents the participant being in the lobby.
 */
class LobbyScreen extends AbstractLobbyScreen<IProps> {
    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    override render() {
        const { _aspectRatio, _roomName } = this.props;
        let contentWrapperStyles;
        let contentContainerStyles;
        let largeVideoContainerStyles;

        if (_aspectRatio === ASPECT_RATIO_NARROW) {
            contentWrapperStyles = preJoinStyles.contentWrapper;
            largeVideoContainerStyles = preJoinStyles.largeVideoContainer;
            contentContainerStyles = styles.contentContainer;
        } else {
            contentWrapperStyles = preJoinStyles.contentWrapperWide;
            largeVideoContainerStyles = preJoinStyles.largeVideoContainerWide;
            contentContainerStyles = preJoinStyles.contentContainerWide;
        }

        return (
            <JitsiScreen
                safeAreaInsets = { [ 'right' ] }
                style = { contentWrapperStyles }>
                <BrandingImageBackground />
                <View style = { largeVideoContainerStyles as ViewStyle }>
                    <View style = { preJoinStyles.displayRoomNameBackdrop as ViewStyle }>
                        <Text
                            numberOfLines = { 1 }
                            style = { preJoinStyles.preJoinRoomName }>
                            { _roomName }
                        </Text>
                    </View>
                    <LargeVideo />
                </View>
                <View style = { contentContainerStyles as ViewStyle }>
                    { this._renderToolbarButtons() }
                    { this._renderContent() }
                </View>
            </JitsiScreen>
        );
    }

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
            <View style = { styles.lobbyWaitingFragmentContainer }>
                <Text style = { styles.lobbyTitle }>
                    { this.props.t('lobby.joiningTitle') }
                </Text>
                <LoadingIndicator
                    color = { BaseTheme.palette.icon01 }
                    style = { styles.loadingIndicator } />
                <Text style = { styles.joiningMessage as TextStyle }>
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
            <Input
                customStyles = {{ input: preJoinStyles.customInput }}
                onChange = { this._onChangeDisplayName }
                placeholder = { t('lobby.nameField') }
                value = { displayName } />
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
            <Input
                autoCapitalize = 'none'
                customStyles = {{ input: styles.customInput }}
                error = { _passwordJoinFailed }
                onChange = { this._onChangePassword }
                placeholder = { t('lobby.enterPasswordButton') }
                secureTextEntry = { true }
                value = { this.state.password } />
        );
    }

    /**
     * Renders the password join button (set).
     *
     * @inheritdoc
     */
    _renderPasswordJoinButtons() {
        return (
            <View style = { styles.passwordJoinButtons }>
                <Button
                    accessibilityLabel = 'lobby.passwordJoinButton'
                    disabled = { !this.state.password }
                    labelKey = { 'lobby.passwordJoinButton' }
                    onClick = { this._onJoinWithPassword }
                    style = { preJoinStyles.joinButton }
                    type = { BUTTON_TYPES.PRIMARY } />
                <Button
                    accessibilityLabel = 'lobby.backToKnockModeButton'
                    labelKey = 'lobby.backToKnockModeButton'
                    onClick = { this._onSwitchToKnockMode }
                    style = { preJoinStyles.joinButton }
                    type = { BUTTON_TYPES.TERTIARY } />
            </View>
        );
    }

    /**
     * Renders the toolbar buttons menu.
     *
     * @inheritdoc
     */
    _renderToolbarButtons() {
        return (
            <View style = { preJoinStyles.toolboxContainer as ViewStyle }>
                <AudioMuteButton
                    styles = { preJoinStyles.buttonStylesBorderless } />
                <VideoMuteButton
                    styles = { preJoinStyles.buttonStylesBorderless } />
            </View>
        );
    }

    /**
     * Renders the standard button set.
     *
     * @inheritdoc
     */
    _renderStandardButtons() {
        const { _knocking, _renderPassword, _isLobbyChatActive } = this.props;
        const { displayName } = this.state;

        return (
            <View style = { styles.formWrapper as ViewStyle }>
                {
                    _knocking && _isLobbyChatActive
                    && <Button
                        accessibilityLabel = 'toolbar.openChat'
                        labelKey = 'toolbar.openChat'
                        onClick = { this._onNavigateToLobbyChat }
                        style = { preJoinStyles.joinButton }
                        type = { BUTTON_TYPES.PRIMARY } />
                }
                {
                    _knocking
                    || <Button
                        accessibilityLabel = 'lobby.knockButton'
                        disabled = { !displayName }
                        labelKey = 'lobby.knockButton'
                        onClick = { this._onAskToJoin }
                        style = { preJoinStyles.joinButton }
                        type = { BUTTON_TYPES.PRIMARY } />
                }
                {
                    _renderPassword
                    && <Button
                        accessibilityLabel = 'lobby.enterPasswordButton'
                        labelKey = 'lobby.enterPasswordButton'
                        onClick = { this._onSwitchToPasswordMode }
                        style = { preJoinStyles.joinButton }
                        type = { BUTTON_TYPES.PRIMARY } />
                }
            </View>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {{
 *     _aspectRatio: Symbol
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        ...abstractMapStateToProps(state),
        _aspectRatio: state['features/base/responsive-ui'].aspectRatio,
        _roomName: getConferenceName(state)
    };
}

export default translate(connect(_mapStateToProps)(LobbyScreen));

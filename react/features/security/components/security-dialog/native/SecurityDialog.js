// @flow

import Clipboard from '@react-native-community/clipboard';
import React, { PureComponent } from 'react';
import {
    Text,
    TextInput,
    View
} from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import type { Dispatch } from 'redux';

import { ColorSchemeRegistry } from '../../../../base/color-scheme';
import { FIELD_UNDERLINE } from '../../../../base/dialog';
import { getFeatureFlag, MEETING_PASSWORD_ENABLED } from '../../../../base/flags';
import { translate } from '../../../../base/i18n';
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
import { isLocalParticipantModerator } from '../../../../base/participants';
import { connect } from '../../../../base/redux';
import { StyleType } from '../../../../base/styles';
import BaseTheme from '../../../../base/ui/components/BaseTheme';
import { isInBreakoutRoom } from '../../../../breakout-rooms/functions';
import { toggleLobbyMode } from '../../../../lobby/actions.any';
import LobbyModeSwitch
    from '../../../../lobby/components/native/LobbyModeSwitch';
import { LOCKED_LOCALLY, LOCKED_REMOTELY } from '../../../../room-lock';
import {
    endRoomLockRequest,
    unlockRoom
} from '../../../../room-lock/actions';

import styles from './styles';

/**
 * The style of the {@link TextInput} rendered by {@code SecurityDialog}. As it
 * requests the entry of a password, {@code TextInput} automatically correcting
 * the entry of the password is a pain to deal with as a user.
 */
const _TEXT_INPUT_PROPS = {
    autoCapitalize: 'none',
    autoCorrect: false
};

/**
 * The type of the React {@code Component} props of {@link SecurityDialog}.
 */
type Props = {

    /**
     * The JitsiConference which requires a password.
     */
    _conference: Object,

    /**
     * The color-schemed stylesheet of the feature.
     */
    _dialogStyles: StyleType,

    /**
     * Whether the local user is the moderator.
     */
    _isModerator: boolean,

    /**
     * State of the lobby mode.
     */
    _lobbyEnabled: boolean,

    /**
     * Whether the lobby mode switch is available or not.
     */
    _lobbyModeSwitchVisible: boolean,

    /**
     * The value for how the conference is locked (or undefined if not locked)
     * as defined by room-lock constants.
     */
    _locked: string,

    /**
     * Checks if the conference room is locked or not.
     */
    _lockedConference: boolean,

    /**
     * The current known password for the JitsiConference.
     */
    _password: string,

    /**
     * Number of digits used in the room-lock password.
     */
    _passwordNumberOfDigits: number,

    /**
     * Whether setting a room password is available or not.
     */
    _roomPasswordControls: boolean,

    /**
     * Redux store dispatch function.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link SecurityDialog}.
 */
type State = {

    /**
     * Password added by the participant for room lock.
     */
    passwordInputValue: string,

    /**
     * Shows an input or a message.
     */
    showElement: boolean
};

/**
 * Component that renders the security options dialog.
 *
 * @returns {React$Element<any>}
 */
class SecurityDialog extends PureComponent<Props, State> {

    /**
     * Instantiates a new {@code SecurityDialog}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            passwordInputValue: '',
            showElement: props._locked === LOCKED_LOCALLY || false
        };

        this._onChangeText = this._onChangeText.bind(this);
        this._onCancel = this._onCancel.bind(this);
        this._onCopy = this._onCopy.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onToggleLobbyMode = this._onToggleLobbyMode.bind(this);
        this._onAddPassword = this._onAddPassword.bind(this);
    }

    /**
     * Implements {@code SecurityDialog.render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <JitsiScreen style = { styles.securityDialogContainer }>
                { this._renderLobbyMode() }
                { this._renderSetRoomPassword() }
            </JitsiScreen>
        );
    }

    /**
     * Renders lobby mode.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderLobbyMode() {
        const {
            _lobbyEnabled,
            _lobbyModeSwitchVisible,
            t
        } = this.props;

        if (!_lobbyModeSwitchVisible) {
            return null;
        }

        return (
            <View style = { styles.lobbyModeContainer }>
                <View style = { styles.lobbyModeContent } >
                    <Text style = { styles.lobbyModeText }>
                        { t('lobby.enableDialogText') }
                    </Text>
                    <View style = { styles.lobbyModeSection }>
                        <Text style = { styles.lobbyModeLabel } >
                            { t('lobby.toggleLabel') }
                        </Text>
                        <LobbyModeSwitch
                            lobbyEnabled = { _lobbyEnabled }
                            onToggleLobbyMode = { this._onToggleLobbyMode } />
                    </View>
                </View>
            </View>
        );
    }

    /**
     * Renders setting the password.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderSetRoomPassword() {
        const {
            _isModerator,
            _locked,
            _lockedConference,
            _password,
            _roomPasswordControls,
            t
        } = this.props;
        const { showElement } = this.state;
        let setPasswordControls;

        if (!_roomPasswordControls) {
            return null;
        }

        if (_locked && showElement) {
            setPasswordControls = (
                <>
                    <TouchableRipple
                        onPress = { this._onCancel }
                        rippleColor = { BaseTheme.palette.ui01 } >
                        <Text style = { styles.passwordSetupButton }>
                            { t('dialog.Remove') }
                        </Text>
                    </TouchableRipple>
                    {
                        _password
                        && <TouchableRipple
                            onPress = { this._onCopy }
                            rippleColor = { BaseTheme.palette.ui01 } >
                            <Text style = { styles.passwordSetupButton }>
                                { t('dialog.copy') }
                            </Text>
                        </TouchableRipple>
                    }
                </>
            );
        } else if (!_lockedConference && showElement) {
            setPasswordControls = (
                <>
                    <TouchableRipple
                        onPress = { this._onCancel }
                        rippleColor = { BaseTheme.palette.ui01 } >
                        <Text style = { styles.passwordSetupButton }>
                            { t('dialog.Cancel') }
                        </Text>
                    </TouchableRipple>
                    <TouchableRipple
                        onPress = { this._onSubmit }
                        rippleColor = { BaseTheme.palette.ui01 } >
                        <Text style = { styles.passwordSetupButton }>
                            { t('dialog.add') }
                        </Text>
                    </TouchableRipple>
                </>
            );
        } else if (!_lockedConference && !showElement) {
            setPasswordControls = (
                <TouchableRipple
                    disabled = { !_isModerator }
                    onPress = { this._onAddPassword }
                    rippleColor = { BaseTheme.palette.ui01 } >
                    <Text style = { styles.passwordSetupButton }>
                        { t('info.addPassword') }
                    </Text>
                </TouchableRipple>
            );
        }

        if (_locked === LOCKED_REMOTELY) {
            if (_isModerator) {
                setPasswordControls = (
                    <View style = { styles.passwordSetRemotelyContainer }>
                        <Text style = { styles.passwordSetRemotelyText }>
                            { t('passwordSetRemotely') }
                        </Text>
                        <TouchableRipple
                            onPress = { this._onCancel }
                            rippleColor = { BaseTheme.palette.ui01 } >
                            <Text style = { styles.passwordSetupButton }>
                                { t('dialog.Remove') }
                            </Text>
                        </TouchableRipple>
                    </View>
                );
            } else {
                setPasswordControls = (
                    <View style = { styles.passwordSetRemotelyContainer }>
                        <Text style = { styles.passwordSetRemotelyTextDisabled }>
                            { t('passwordSetRemotely') }
                        </Text>
                        <TouchableRipple
                            disabled = { !_isModerator }
                            onPress = { this._onAddPassword }
                            rippleColor = { BaseTheme.palette.ui01 } >
                            <Text style = { styles.passwordSetupButton }>
                                { t('info.addPassword') }
                            </Text>
                        </TouchableRipple>
                    </View>
                );
            }
        }

        return (
            <View
                style = { styles.passwordContainer } >
                <Text style = { styles.passwordContainerText }>
                    { t('security.about') }
                </Text>
                <View
                    style = {
                        _locked !== LOCKED_REMOTELY
                        && styles.passwordContainerControls
                    }>
                    <View>
                        { this._setRoomPasswordMessage() }
                    </View>
                    { setPasswordControls }
                </View>
            </View>
        );
    }

    /**
     * Renders room lock text input/message.
     *
     * @returns {ReactElement}
     * @private
     */
    _setRoomPasswordMessage() {
        let textInputProps = _TEXT_INPUT_PROPS;
        const {
            _isModerator,
            _locked,
            _password,
            _passwordNumberOfDigits,
            t
        } = this.props;
        const { passwordInputValue, showElement } = this.state;

        if (_passwordNumberOfDigits) {
            textInputProps = {
                ...textInputProps,
                keyboardType: 'numeric',
                maxLength: _passwordNumberOfDigits
            };
        }

        if (!_isModerator) {
            return null;
        }

        if (showElement) {
            if (typeof _locked === 'undefined') {
                return (
                    <TextInput
                        autoFocus = { true }
                        onChangeText = { this._onChangeText }
                        placeholder = { t('lobby.passwordField') }
                        placeholderTextColor = { BaseTheme.palette.text03 }
                        selectionColor = { BaseTheme.palette.text03 }
                        style = { styles.passwordInput }
                        underlineColorAndroid = { FIELD_UNDERLINE }
                        value = { passwordInputValue }
                        { ...textInputProps } />
                );
            } else if (_locked) {
                if (_locked === LOCKED_LOCALLY && typeof _password !== 'undefined') {
                    return (
                        <View style = { styles.savedPasswordContainer }>
                            <Text style = { styles.savedPasswordLabel }>
                                { t('info.password') }
                            </Text>
                            <Text style = { styles.savedPassword }>
                                { passwordInputValue }
                            </Text>
                        </View>
                    );
                }
            }
        }
    }

    _onToggleLobbyMode: () => void;

    /**
     * Handles the enable-disable lobby mode switch.
     *
     * @private
     * @returns {void}
     */
    _onToggleLobbyMode() {
        const { _lobbyEnabled, dispatch } = this.props;

        if (_lobbyEnabled) {
            dispatch(toggleLobbyMode(false));
        } else {
            dispatch(toggleLobbyMode(true));
        }
    }

    _onAddPassword: () => void;

    /**
     * Callback to be invoked when add password button is pressed.
     *
     * @returns {void}
     */
    _onAddPassword() {
        const { showElement } = this.state;

        this.setState({
            showElement: !showElement
        });
    }

    /**
     * Verifies input in case only digits are required.
     *
     * @param {string} passwordInputValue - The value of the password
     * text input.
     * @private
     * @returns {boolean} False when the value is not valid and True otherwise.
     */
    _validateInputValue(passwordInputValue: string) {
        const { _passwordNumberOfDigits } = this.props;

        // we want only digits,
        // but both number-pad and numeric add ',' and '.' as symbols
        if (_passwordNumberOfDigits
            && passwordInputValue.length > 0
            && !/^\d+$/.test(passwordInputValue)) {
            return false;
        }

        return true;
    }

    _onChangeText: string => void;

    /**
     * Callback to be invoked when the text in the field changes.
     *
     * @param {string} passwordInputValue - The value of password input.
     * @returns {void}
     */
    _onChangeText(passwordInputValue) {
        if (!this._validateInputValue(passwordInputValue)) {
            return;
        }

        this.setState({
            passwordInputValue
        });
    }

    _onCancel: () => void;

    /**
     * Cancels value typed in text input.
     *
     * @returns {void}
     */
    _onCancel() {
        this.setState({
            passwordInputValue: '',
            showElement: false
        });

        this.props.dispatch(unlockRoom());
    }

    _onCopy: () => void;

    /**
     * Copies room password.
     *
     * @returns {void}
     */
    _onCopy() {
        const { passwordInputValue } = this.state;

        Clipboard.setString(passwordInputValue);
    }

    _onSubmit: () => void;

    /**
     * Submits value typed in text input.
     *
     * @returns {void}
     */
    _onSubmit() {
        const {
            _conference,
            dispatch
        } = this.props;
        const { passwordInputValue } = this.state;

        dispatch(endRoomLockRequest(_conference, passwordInputValue));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: Object): Object {
    const { conference, locked, password } = state['features/base/conference'];
    const { hideLobbyButton } = state['features/base/config'];
    const { lobbyEnabled } = state['features/lobby'];
    const { roomPasswordNumberOfDigits } = state['features/base/config'];
    const lobbySupported = conference && conference.isLobbySupported();
    const visible = getFeatureFlag(state, MEETING_PASSWORD_ENABLED, true);

    return {
        _conference: conference,
        _dialogStyles: ColorSchemeRegistry.get(state, 'Dialog'),
        _isModerator: isLocalParticipantModerator(state),
        _lobbyEnabled: lobbyEnabled,
        _lobbyModeSwitchVisible:
            lobbySupported && isLocalParticipantModerator(state) && !hideLobbyButton && !isInBreakoutRoom(state),
        _locked: locked,
        _lockedConference: Boolean(conference && locked),
        _password: password,
        _passwordNumberOfDigits: roomPasswordNumberOfDigits,
        _roomPasswordControls: visible
    };
}


export default translate(connect(_mapStateToProps)(SecurityDialog));

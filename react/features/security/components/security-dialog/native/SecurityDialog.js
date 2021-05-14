// @flow

import React, { PureComponent } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    View
} from 'react-native';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';

import { ColorSchemeRegistry } from '../../../../base/color-scheme';
import {
    FIELD_UNDERLINE,
    CustomSubmitDialog
} from '../../../../base/dialog';
import { getFeatureFlag, MEETING_PASSWORD_ENABLED } from '../../../../base/flags';
import { translate } from '../../../../base/i18n';
import { isLocalParticipantModerator } from '../../../../base/participants';
import { StyleType } from '../../../../base/styles';
import { toggleLobbyMode } from '../../../../lobby/actions.any';
import LobbyModeSwitch
    from '../../../../lobby/components/native/LobbyModeSwitch';
import { LOCKED_LOCALLY } from '../../../../room-lock';
import {
    endRoomLockRequest,
    unlockRoom
} from '../../../../room-lock/actions';
import RoomLockSwitch from '../../../../room-lock/components/RoomLockSwitch';

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
     * Whether the room lock switch is available or not.
     */
    _roomLockSwitchVisible: boolean,

    /**
     * The color-schemed stylesheet of the security dialog feature.
     */
    _securityDialogStyles: StyleType,

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
        this._onSubmit = this._onSubmit.bind(this);
        this._onToggleLobbyMode = this._onToggleLobbyMode.bind(this);
        this._onToggleRoomLock = this._onToggleRoomLock.bind(this);
    }

    /**
     * Implements {@code SecurityDialog.render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <CustomSubmitDialog
                onSubmit = { this._onSubmit }>
                <KeyboardAvoidingView
                    behavior =
                        {
                            Platform.OS === 'ios'
                                ? 'padding' : 'height'
                        }
                    enabled = { true }>
                    { this._renderLobbyMode() }
                    { this._renderRoomLock() }
                </KeyboardAvoidingView>
            </CustomSubmitDialog>
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
            _securityDialogStyles,
            t
        } = this.props;

        if (!_lobbyModeSwitchVisible) {
            return null;
        }

        return (
            <View>
                <Text style = { _securityDialogStyles.title } >
                    { t('lobby.dialogTitle') }
                </Text>
                <Text style = { _securityDialogStyles.text } >
                    { t('lobby.enableDialogText') }
                </Text>
                <LobbyModeSwitch
                    lobbyEnabled = { _lobbyEnabled }
                    onToggleLobbyMode = { this._onToggleLobbyMode } />
            </View>
        );
    }

    /**
     * Renders room lock.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderRoomLock() {
        const {
            _isModerator,
            _locked,
            _lockedConference,
            _roomLockSwitchVisible,
            _securityDialogStyles,
            t
        } = this.props;
        const { showElement } = this.state;

        if (!_roomLockSwitchVisible) {
            return null;
        }

        return (
            <View>
                <Text style = { _securityDialogStyles.title } >
                    { t('dialog.lockRoom') }
                </Text>
                <Text style = { _securityDialogStyles.text } >
                    { t('security.about') }
                </Text>
                <RoomLockSwitch
                    disabled = { !_isModerator }
                    locked = { _locked }
                    onToggleRoomLock = { this._onToggleRoomLock }
                    toggleRoomLock = { showElement || _lockedConference } />
                { this._renderRoomLockMessage() }
            </View>
        );
    }

    /**
     * Renders room lock text input/message.
     *
     * @returns {ReactElement}
     * @private
     */
    _renderRoomLockMessage() {
        let textInputProps = _TEXT_INPUT_PROPS;
        const {
            _isModerator,
            _locked,
            _password,
            _passwordNumberOfDigits,
            _securityDialogStyles,
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
                        onChangeText = { this._onChangeText }
                        placeholder = { t('lobby.passwordField') }
                        style = { _securityDialogStyles.field }
                        underlineColorAndroid = { FIELD_UNDERLINE }
                        value = { passwordInputValue }
                        { ...textInputProps } />
                );
            } else if (_locked) {
                if (_locked === LOCKED_LOCALLY && typeof _password !== 'undefined') {
                    return (
                        <TextInput
                            onChangeText = { this._onChangeText }
                            placeholder = { _password }
                            style = { _securityDialogStyles.field }
                            underlineColorAndroid = { FIELD_UNDERLINE }
                            value = { passwordInputValue }
                            { ...textInputProps } />
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

    _onToggleRoomLock: () => void;

    /**
     * Callback to be invoked when room lock button is pressed.
     *
     * @returns {void}
     */
    _onToggleRoomLock() {
        const { _isModerator, _locked, dispatch } = this.props;
        const { showElement } = this.state;

        this.setState({
            showElement: !showElement
        });

        if (_locked && _isModerator) {
            dispatch(unlockRoom());

            this.setState({
                showElement: false
            });
        }
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

    _onSubmit: () => boolean;

    /**
     * Submits value typed in text input.
     *
     * @returns {boolean} False because we do not want to hide this
     * dialog/prompt as the hiding will be handled inside endRoomLockRequest
     * after setting the password is resolved.
     */
    _onSubmit() {
        const {
            _conference,
            dispatch
        } = this.props;
        const { passwordInputValue } = this.state;

        dispatch(endRoomLockRequest(_conference, passwordInputValue));

        return false;
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
            lobbySupported && isLocalParticipantModerator(state) && !hideLobbyButton,
        _locked: locked,
        _lockedConference: Boolean(conference && locked),
        _password: password,
        _passwordNumberOfDigits: roomPasswordNumberOfDigits,
        _roomLockSwitchVisible: visible,
        _securityDialogStyles: ColorSchemeRegistry.get(state, 'SecurityDialog')
    };
}


export default translate(connect(_mapStateToProps)(SecurityDialog));

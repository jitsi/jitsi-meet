import React, { PureComponent } from 'react';
import {
    Text,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../../app/types';
import { IJitsiConference } from '../../../../base/conference/reducer';
import { getSecurityUiConfig } from '../../../../base/config/functions.any';
import { MEETING_PASSWORD_ENABLED } from '../../../../base/flags/constants';
import { getFeatureFlag } from '../../../../base/flags/functions';
import { translate } from '../../../../base/i18n/functions';
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
import { isLocalParticipantModerator } from '../../../../base/participants/functions';
import Button from '../../../../base/ui/components/native/Button';
import Input from '../../../../base/ui/components/native/Input';
import Switch from '../../../../base/ui/components/native/Switch';
import { BUTTON_TYPES } from '../../../../base/ui/constants.native';
import { copyText } from '../../../../base/util/copyText.native';
import { isInBreakoutRoom } from '../../../../breakout-rooms/functions';
import { toggleLobbyMode } from '../../../../lobby/actions.any';
import { isEnablingLobbyAllowed } from '../../../../lobby/functions';
import {
    endRoomLockRequest,
    unlockRoom
} from '../../../../room-lock/actions';
import { LOCKED_LOCALLY, LOCKED_REMOTELY } from '../../../../room-lock/constants';

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
interface IProps {

    /**
     * The JitsiConference which requires a password.
     */
    _conference?: IJitsiConference;

    /**
     * Whether enabling lobby is allowed or not.
     */
    _isEnablingLobbyAllowed: boolean;

    /**
     * Whether the local user is the moderator.
     */
    _isModerator: boolean;

    /**
     * Whether lobby mode is enabled or not.
     */
    _lobbyEnabled: boolean;

    /**
     * Whether the lobby mode switch is available or not.
     */
    _lobbyModeSwitchVisible: boolean;

    /**
     * The value for how the conference is locked (or undefined if not locked)
     * as defined by room-lock constants.
     */
    _locked?: string;

    /**
     * Checks if the conference room is locked or not.
     */
    _lockedConference: boolean;

    /**
     * The current known password for the JitsiConference.
     */
    _password?: string;

    /**
     * Number of digits used in the room-lock password.
     */
    _passwordNumberOfDigits?: number;

    /**
     * Whether setting a room password is available or not.
     */
    _roomPasswordControls: boolean;

    /**
     * Redux store dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Invoked to obtain translated strings.
     */
    t: Function;
}

/**
 * The type of the React {@code Component} state of {@link SecurityDialog}.
 */
interface IState {

    /**
     * State of lobby mode.
     */
    lobbyEnabled: boolean;

    /**
     * Password added by the participant for room lock.
     */
    passwordInputValue: string;

    /**
     * Shows an input or a message.
     */
    showElement: boolean;
}

/**
 * Component that renders the security options dialog.
 *
 * @returns {React$Element<any>}
 */
class SecurityDialog extends PureComponent<IProps, IState> {

    /**
     * Instantiates a new {@code SecurityDialog}.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            lobbyEnabled: props._lobbyEnabled,
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
            _isEnablingLobbyAllowed,
            _lobbyModeSwitchVisible,
            t
        } = this.props;

        if (!_lobbyModeSwitchVisible || !_isEnablingLobbyAllowed) {
            return null;
        }

        return (
            <View style = { styles.lobbyModeContainer }>
                <View style = { styles.lobbyModeContent } >
                    <Text style = { styles.lobbyModeText }>
                        { t('lobby.enableDialogText') }
                    </Text>
                    <View style = { styles.lobbyModeSection as ViewStyle }>
                        <Text style = { styles.lobbyModeLabel as TextStyle } >
                            { t('lobby.toggleLabel') }
                        </Text>
                        <Switch
                            checked = { this.state.lobbyEnabled }
                            onChange = { this._onToggleLobbyMode } />
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
                    <Button
                        accessibilityLabel = 'dialog.Remove'
                        labelKey = 'dialog.Remove'
                        labelStyle = { styles.passwordSetupButtonLabel }
                        onClick = { this._onCancel }
                        type = { BUTTON_TYPES.TERTIARY } />
                    {
                        _password
                        && <Button
                            accessibilityLabel = 'dialog.copy'
                            labelKey = 'dialog.copy'
                            labelStyle = { styles.passwordSetupButtonLabel }
                            onClick = { this._onCopy }
                            type = { BUTTON_TYPES.TERTIARY } />
                    }
                </>
            );
        } else if (!_lockedConference && showElement) {
            setPasswordControls = (
                <>
                    <Button
                        accessibilityLabel = 'dialog.Cancel'
                        labelKey = 'dialog.Cancel'
                        labelStyle = { styles.passwordSetupButtonLabel }
                        onClick = { this._onCancel }
                        type = { BUTTON_TYPES.TERTIARY } />
                    <Button
                        accessibilityLabel = 'dialog.add'
                        labelKey = 'dialog.add'
                        labelStyle = { styles.passwordSetupButtonLabel }
                        onClick = { this._onSubmit }
                        type = { BUTTON_TYPES.TERTIARY } />
                </>
            );
        } else if (!_lockedConference && !showElement) {
            setPasswordControls = (
                <Button
                    accessibilityLabel = 'info.addPassword'
                    disabled = { !_isModerator }
                    labelKey = 'info.addPassword'
                    labelStyle = { styles.passwordSetupButtonLabel }
                    onClick = { this._onAddPassword }
                    type = { BUTTON_TYPES.TERTIARY } />
            );
        }

        if (_locked === LOCKED_REMOTELY) {
            if (_isModerator) {
                setPasswordControls = (
                    <View style = { styles.passwordSetRemotelyContainer as ViewStyle }>
                        <Text style = { styles.passwordSetRemotelyText }>
                            { t('passwordSetRemotely') }
                        </Text>
                        <Button
                            accessibilityLabel = 'dialog.Remove'
                            labelKey = 'dialog.Remove'
                            labelStyle = { styles.passwordSetupButtonLabel }
                            onClick = { this._onCancel }
                            type = { BUTTON_TYPES.TERTIARY } />
                    </View>
                );
            } else {
                setPasswordControls = (
                    <View style = { styles.passwordSetRemotelyContainer as ViewStyle }>
                        <Text style = { styles.passwordSetRemotelyTextDisabled }>
                            { t('passwordSetRemotely') }
                        </Text>
                        <Button
                            accessibilityLabel = 'info.addPassword'
                            disabled = { !_isModerator }
                            labelKey = 'info.addPassword'
                            labelStyle = { styles.passwordSetupButtonLabel }
                            onClick = { this._onAddPassword }
                            type = { BUTTON_TYPES.TERTIARY } />
                    </View>
                );
            }
        }

        return (
            <View
                style = { styles.passwordContainer } >
                <Text style = { styles.passwordContainerText }>
                    { t(_isModerator ? 'security.about' : 'security.aboutReadOnly') }
                </Text>
                <View
                    style = {
                        _locked !== LOCKED_REMOTELY
                        && styles.passwordContainerControls as ViewStyle
                    }>
                    <View>
                        { this._setRoomPasswordMessage() }
                    </View>
                    { _isModerator && setPasswordControls }
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
        let textInputProps: any = _TEXT_INPUT_PROPS;
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
                    <Input
                        accessibilityLabel = { t('info.addPassword') }
                        autoFocus = { true }
                        clearable = { true }
                        customStyles = {{ container: styles.customContainer }}
                        onChange = { this._onChangeText }
                        placeholder = { t('dialog.password') }
                        value = { passwordInputValue }
                        { ...textInputProps } />
                );
            } else if (_locked) {
                if (_locked === LOCKED_LOCALLY && typeof _password !== 'undefined') {
                    return (
                        <View style = { styles.savedPasswordContainer as ViewStyle }>
                            <Text style = { styles.savedPasswordLabel as TextStyle }>
                                { t('info.password') }
                            </Text>
                            <Text style = { styles.savedPassword }>
                                { _password }
                            </Text>
                        </View>
                    );
                }
            }
        }
    }

    /**
     * Handles the enable-disable lobby mode switch.
     *
     * @private
     * @returns {void}
     */
    _onToggleLobbyMode() {
        const { dispatch } = this.props;
        const { lobbyEnabled } = this.state;

        this.setState({
            lobbyEnabled: !lobbyEnabled
        });

        dispatch(toggleLobbyMode(!lobbyEnabled));
    }

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

    /**
     * Callback to be invoked when the text in the field changes.
     *
     * @param {string} passwordInputValue - The value of password input.
     * @returns {void}
     */
    _onChangeText(passwordInputValue: string) {
        if (!this._validateInputValue(passwordInputValue)) {
            return;
        }

        this.setState({
            passwordInputValue
        });
    }

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

    /**
     * Copies room password.
     *
     * @returns {void}
     */
    _onCopy() {
        const { passwordInputValue } = this.state;

        copyText(passwordInputValue);
    }

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

        _conference && dispatch(endRoomLockRequest(_conference, passwordInputValue));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { conference, locked, password } = state['features/base/conference'];
    const { disableLobbyPassword, hideLobbyButton } = getSecurityUiConfig(state);
    const { lobbyEnabled } = state['features/lobby'];
    const { roomPasswordNumberOfDigits } = state['features/base/config'];
    const lobbySupported = conference?.isLobbySupported();
    const visible = getFeatureFlag(state, MEETING_PASSWORD_ENABLED, true);

    return {
        _conference: conference,
        _isEnablingLobbyAllowed: isEnablingLobbyAllowed(state),
        _isModerator: isLocalParticipantModerator(state),
        _lobbyEnabled: lobbyEnabled,
        _lobbyModeSwitchVisible:
            lobbySupported && isLocalParticipantModerator(state) && !hideLobbyButton && !isInBreakoutRoom(state),
        _locked: locked,
        _lockedConference: Boolean(conference && locked),
        _password: password,
        _passwordNumberOfDigits: roomPasswordNumberOfDigits,
        _roomPasswordControls: visible && !disableLobbyPassword
    };
}


export default translate(connect(_mapStateToProps)(SecurityDialog));

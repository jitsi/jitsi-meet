import React, { PureComponent } from 'react';

import { IReduxState, IStore } from '../../app/types';
import { conferenceWillJoin } from '../../base/conference/actions';
import { getConferenceName } from '../../base/conference/functions';
import { IJitsiConference } from '../../base/conference/reducer';
import { getSecurityUiConfig } from '../../base/config/functions.any';
import { INVITE_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { getLocalParticipant } from '../../base/participants/functions';
import { getFieldValue } from '../../base/react/functions';
import { updateSettings } from '../../base/settings/actions';
import { IMessage } from '../../chat/types';
import { isDeviceStatusVisible } from '../../prejoin/functions';
import { cancelKnocking, joinWithPassword, onSendMessage, setPasswordJoinFailed, startKnocking } from '../actions';

export const SCREEN_STATES = {
    EDIT: 1,
    PASSWORD: 2,
    VIEW: 3
};

export interface IProps {

    /**
     * Indicates whether the device status should be visible.
     */
    _deviceStatusVisible: boolean;

    /**
     * Indicates whether the message that display name is required is shown.
     */
    _isDisplayNameRequiredActive: boolean;

    /**
     * True if moderator initiated a chat session with the participant.
     */
    _isLobbyChatActive: boolean;

    /**
     * True if knocking is already happening, so we're waiting for a response.
     */
    _knocking: boolean;

    /**
    * Lobby messages between moderator and the participant.
    */
    _lobbyChatMessages: IMessage[];

    /**
     * Name of the lobby chat recipient.
     */
    _lobbyMessageRecipient?: string;

    /**
     * The name of the meeting we're about to join.
     */
    _meetingName: string;

    /**
     * The members only conference if any,.
     */
    _membersOnlyConference?: IJitsiConference;

    /**
     * The email of the participant about to knock/join.
     */
    _participantEmail?: string;

    /**
     * The id of the participant about to knock/join. This is the participant ID in the lobby room, at this point.
     */
    _participantId?: string;

    /**
     * The name of the participant about to knock/join.
     */
    _participantName?: string;

    /**
     * True if a recent attempt to join with password failed.
     */
    _passwordJoinFailed: boolean;

    /**
     * True if the password field should be available for lobby participants.
     */
    _renderPassword: boolean;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Indicates whether the copy url button should be shown.
     */
    showCopyUrlButton: boolean;

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function;
}

interface IState {

    /**
     * The display name value entered into the field.
     */
    displayName: string;

    /**
     * The email value entered into the field.
     */
    email: string;

    /**
     * True if lobby chat widget is open.
     */
    isChatOpen: boolean;

    /**
     * The password value entered into the field.
     */
    password: string;

    /**
     * True if a recent attempt to join with password failed.
     */
    passwordJoinFailed: boolean;

    /**
     * The state of the screen. One of {@code SCREEN_STATES[*]}.
     */
    screenState: number;
}

/**
 * Abstract class to encapsulate the platform common code of the {@code LobbyScreen}.
 */
export default class AbstractLobbyScreen<P extends IProps = IProps> extends PureComponent<P, IState> {
    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this.state = {
            displayName: props._participantName || '',
            email: props._participantEmail || '',
            isChatOpen: true,
            password: '',
            passwordJoinFailed: false,
            screenState: props._participantName ? SCREEN_STATES.VIEW : SCREEN_STATES.EDIT
        };

        this._onAskToJoin = this._onAskToJoin.bind(this);
        this._onCancel = this._onCancel.bind(this);
        this._onChangeDisplayName = this._onChangeDisplayName.bind(this);
        this._onChangeEmail = this._onChangeEmail.bind(this);
        this._onChangePassword = this._onChangePassword.bind(this);
        this._onEnableEdit = this._onEnableEdit.bind(this);
        this._onJoinWithPassword = this._onJoinWithPassword.bind(this);
        this._onSendMessage = this._onSendMessage.bind(this);
        this._onSwitchToKnockMode = this._onSwitchToKnockMode.bind(this);
        this._onSwitchToPasswordMode = this._onSwitchToPasswordMode.bind(this);
        this._onToggleChat = this._onToggleChat.bind(this);
    }

    /**
     * Implements {@code PureComponent.getDerivedStateFromProps}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: IProps, state: IState) {
        if (props._passwordJoinFailed && !state.passwordJoinFailed) {
            return {
                password: '',
                passwordJoinFailed: true
            };
        }

        return null;
    }

    /**
     * Returns the screen title.
     *
     * @returns {string}
     */
    _getScreenTitleKey() {
        const { screenState } = this.state;
        const passwordPrompt = screenState === SCREEN_STATES.PASSWORD;

        return !passwordPrompt && this.props._knocking
            ? this.props._isLobbyChatActive ? 'lobby.lobbyChatStartedTitle' : 'lobby.joiningTitle'
            : passwordPrompt ? 'lobby.enterPasswordTitle' : 'lobby.joinTitle';
    }

    /**
     * Callback to be invoked when the user submits the joining request.
     *
     * @returns {void}
     */
    _onAskToJoin() {
        this.setState({
            password: ''
        });

        this.props.dispatch(startKnocking());

        return false;
    }

    /**
     * Callback to be invoked when the user cancels the dialog.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        this.props.dispatch(cancelKnocking());

        return true;
    }

    /**
     * Callback to be invoked when the user changes its display name.
     *
     * @param {SyntheticEvent} event - The SyntheticEvent instance of the change.
     * @returns {void}
     */
    _onChangeDisplayName(event: { target: { value: string; }; } | string) {
        const displayName = getFieldValue(event);

        this.setState({
            displayName
        }, () => {
            this.props.dispatch(updateSettings({
                displayName
            }));
        });
    }

    /**
     * Callback to be invoked when the user changes its email.
     *
     * @param {SyntheticEvent} event - The SyntheticEvent instance of the change.
     * @returns {void}
     */
    _onChangeEmail(event: { target: { value: string; }; } | string) {
        const email = getFieldValue(event);

        this.setState({
            email
        }, () => {
            this.props.dispatch(updateSettings({
                email
            }));
        });
    }

    /**
     * Callback to be invoked when the user changes the password.
     *
     * @param {SyntheticEvent} event - The SyntheticEvent instance of the change.
     * @returns {void}
     */
    _onChangePassword(event: { target: { value: string; }; } | string) {
        this.setState({
            password: getFieldValue(event)
        });
    }

    /**
     * Callback to be invoked for the edit button.
     *
     * @returns {void}
     */
    _onEnableEdit() {
        this.setState({
            screenState: SCREEN_STATES.EDIT
        });
    }

    /**
     * Callback to be invoked when the user tries to join using a preset password.
     *
     * @returns {void}
     */
    _onJoinWithPassword() {
        this.setState({
            passwordJoinFailed: false
        });
        this.props.dispatch(joinWithPassword(this.state.password));
    }

    /**
     * Callback to be invoked for sending lobby chat messages.
     *
     * @param {string} message - Message to be sent.
     * @returns {void}
     */
    _onSendMessage(message: string) {
        this.props.dispatch(onSendMessage(message));
    }

    /**
     * Callback to be invoked for the enter (go back to) knocking mode button.
     *
     * @returns {void}
     */
    _onSwitchToKnockMode() {
        this.setState({
            password: '',
            screenState: this.state.displayName ? SCREEN_STATES.VIEW : SCREEN_STATES.EDIT
        });
        this.props.dispatch(setPasswordJoinFailed(false));

        // let's return to the correct state after password failed
        this.props.dispatch(conferenceWillJoin(this.props._membersOnlyConference));
    }

    /**
     * Callback to be invoked for the enter password button.
     *
     * @returns {void}
     */
    _onSwitchToPasswordMode() {
        this.setState({
            screenState: SCREEN_STATES.PASSWORD
        });
    }

    /**
     * Callback to be invoked for toggling lobby chat visibility.
     *
     * @returns {void}
     */
    _onToggleChat() {
        this.setState(_prevState => {
            return {
                isChatOpen: !_prevState.isChatOpen
            };
        });
    }

    /**
     * Renders the content of the dialog.
     *
     * @returns {React$Element}
     */
    _renderContent() {
        const { _knocking } = this.props;
        const { screenState } = this.state;

        if (screenState !== SCREEN_STATES.PASSWORD && _knocking) {
            return this._renderJoining();
        }

        return (
            <>
                { screenState === SCREEN_STATES.VIEW && this._renderParticipantInfo() }
                { screenState === SCREEN_STATES.EDIT && this._renderParticipantForm() }
                { screenState === SCREEN_STATES.PASSWORD && this._renderPasswordForm() }

                { (screenState === SCREEN_STATES.VIEW || screenState === SCREEN_STATES.EDIT)
                    && this._renderStandardButtons() }
                { screenState === SCREEN_STATES.PASSWORD && this._renderPasswordJoinButtons() }
            </>
        );
    }

    /**
     * Renders the joining (waiting) fragment of the screen.
     *
     * @returns {React$Element}
     */
    _renderJoining() {
        return <></>;
    }

    /**
     * Renders the participant form to let the knocking participant enter its details.
     *
     * @returns {React$Element}
     */
    _renderParticipantForm() {
        return <></>;
    }

    /**
     * Renders the participant info fragment when we have all the required details of the user.
     *
     * @returns {React$Element}
     */
    _renderParticipantInfo() {
        return <></>;
    }

    /**
     * Renders the password form to let the participant join by using a password instead of knocking.
     *
     * @returns {React$Element}
     */
    _renderPasswordForm() {
        return <></>;
    }

    /**
     * Renders the password join button (set).
     *
     * @returns {React$Element}
     */
    _renderPasswordJoinButtons() {
        return <></>;
    }

    /**
     * Renders the standard (pre-knocking) button set.
     *
     * @returns {React$Element}
     */
    _renderStandardButtons() {
        return <></>;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState) {
    const localParticipant = getLocalParticipant(state);
    const participantId = localParticipant?.id;
    const inviteEnabledFlag = getFeatureFlag(state, INVITE_ENABLED, true);
    const { disableInviteFunctions } = state['features/base/config'];
    const { isDisplayNameRequiredError, knocking, passwordJoinFailed } = state['features/lobby'];
    const { iAmSipGateway } = state['features/base/config'];
    const { disableLobbyPassword } = getSecurityUiConfig(state);
    const showCopyUrlButton = inviteEnabledFlag || !disableInviteFunctions;
    const deviceStatusVisible = isDeviceStatusVisible(state);
    const { membersOnly, lobbyWaitingForHost } = state['features/base/conference'];
    const { isLobbyChatActive, lobbyMessageRecipient, messages } = state['features/chat'];

    return {
        _deviceStatusVisible: deviceStatusVisible,
        _isDisplayNameRequiredActive: Boolean(isDisplayNameRequiredError),
        _knocking: knocking,
        _lobbyChatMessages: messages,
        _lobbyMessageRecipient: lobbyMessageRecipient?.name,
        _isLobbyChatActive: isLobbyChatActive,
        _meetingName: getConferenceName(state),
        _membersOnlyConference: membersOnly,
        _participantEmail: localParticipant?.email,
        _participantId: participantId,
        _participantName: localParticipant?.name,
        _passwordJoinFailed: passwordJoinFailed,
        _renderPassword: !iAmSipGateway && !disableLobbyPassword && !lobbyWaitingForHost,
        showCopyUrlButton
    };
}

// @flow
// eslint-disable-next-line no-unused-vars
import React, { PureComponent } from 'react';

import { getConferenceName } from '../../base/conference';
import { getLocalParticipant } from '../../base/participants';
import { getFieldValue } from '../../base/react';
import { updateSettings } from '../../base/settings';
import { cancelKnocking, joinWithPassword, setPasswordJoinFailed, startKnocking } from '../actions';

export const SCREEN_STATES = {
    EDIT: 1,
    PASSWORD: 2,
    VIEW: 3
};

export type Props = {

    /**
     * True if knocking is already happening, so we're waiting for a response.
     */
    _knocking: boolean,

    /**
     * The name of the meeting we're about to join.
     */
    _meetingName: string,

    /**
     * The email of the participant about to knock/join.
     */
    _participantEmail: string,

    /**
     * The id of the participant about to knock/join. This is the participant ID in the lobby room, at this point.
     */
    _participantId: string,

    /**
     * The name of the participant about to knock/join.
     */
    _participantName: string;

    /**
     * True if a recent attempt to join with password failed.
     */
    _passwordJoinFailed: boolean,

    /**
     * True if the password field should be available for lobby participants.
     */
     _renderPassword: boolean,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

type State = {

    /**
     * The display name value entered into the field.
     */
    displayName: string,

    /**
     * The email value entered into the field.
     */
    email: string,

    /**
     * The password value entered into the field.
     */
    password: string,

    /**
     * True if a recent attempt to join with password failed.
     */
    passwordJoinFailed: boolean,

    /**
     * The state of the screen. One of {@code SCREEN_STATES[*]}
     */
    screenState: number
}

/**
 * Abstract class to encapsulate the platform common code of the {@code LobbyScreen}.
 */
export default class AbstractLobbyScreen<P: Props = Props> extends PureComponent<P, State> {
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
        this._onSwitchToKnockMode = this._onSwitchToKnockMode.bind(this);
        this._onSwitchToPasswordMode = this._onSwitchToPasswordMode.bind(this);
    }

    /**
     * Implements {@code PureComponent.getDerivedStateFromProps}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, state: State) {
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
            ? 'lobby.joiningTitle'
            : passwordPrompt ? 'lobby.enterPasswordTitle' : 'lobby.joinTitle';
    }

    _onAskToJoin: () => void;

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

    _onCancel: () => boolean;

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

    _onChangeDisplayName: Object => void;

    /**
     * Callback to be invoked when the user changes its display name.
     *
     * @param {SyntheticEvent} event - The SyntheticEvent instance of the change.
     * @returns {void}
     */
    _onChangeDisplayName(event) {
        const displayName = getFieldValue(event);

        this.setState({
            displayName
        }, () => {
            this.props.dispatch(updateSettings({
                displayName
            }));
        });
    }

    _onChangeEmail: Object => void;

    /**
     * Callback to be invoked when the user changes its email.
     *
     * @param {SyntheticEvent} event - The SyntheticEvent instance of the change.
     * @returns {void}
     */
    _onChangeEmail(event) {
        const email = getFieldValue(event);

        this.setState({
            email
        }, () => {
            this.props.dispatch(updateSettings({
                email
            }));
        });
    }

    _onChangePassword: Object => void;

    /**
     * Callback to be invoked when the user changes the password.
     *
     * @param {SyntheticEvent} event - The SyntheticEvent instance of the change.
     * @returns {void}
     */
    _onChangePassword(event) {
        this.setState({
            password: getFieldValue(event)
        });
    }

    _onEnableEdit: () => void;

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

    _onJoinWithPassword: () => void;

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

    _onSwitchToKnockMode: () => void;

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
    }

    _onSwitchToPasswordMode: () => void;

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
    _renderJoining: () => React$Element<*>;

    /**
     * Renders the participant form to let the knocking participant enter its details.
     *
     * @returns {React$Element}
     */
    _renderParticipantForm: () => React$Element<*>;

    /**
     * Renders the participant info fragment when we have all the required details of the user.
     *
     * @returns {React$Element}
     */
    _renderParticipantInfo: () => React$Element<*>;

    /**
     * Renders the password form to let the participant join by using a password instead of knocking.
     *
     * @returns {React$Element}
     */
    _renderPasswordForm: () => React$Element<*>;

    /**
     * Renders the password join button (set).
     *
     * @returns {React$Element}
     */
    _renderPasswordJoinButtons: () => React$Element<*>;

    /**
     * Renders the standard (pre-knocking) button set.
     *
     * @returns {React$Element}
     */
    _renderStandardButtons: () => React$Element<*>;
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object): $Shape<Props> {
    const localParticipant = getLocalParticipant(state);
    const participantId = localParticipant?.id;
    const { knocking, passwordJoinFailed } = state['features/lobby'];
    const { iAmSipGateway } = state['features/base/config'];

    return {
        _knocking: knocking,
        _meetingName: getConferenceName(state),
        _participantEmail: localParticipant?.email,
        _participantId: participantId,
        _participantName: localParticipant?.name,
        _passwordJoinFailed: passwordJoinFailed,
        _renderPassword: !iAmSipGateway
    };
}

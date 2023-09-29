import { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState, IStore } from '../../app/types';
import { getParticipantById } from '../../base/participants/functions';
import { IParticipant } from '../../base/participants/types';
import { sendMessage, setPrivateMessageRecipient } from '../actions';

interface IProps extends WithTranslation {

    /**
     * Prop to be invoked on sending the message.
     */
    _onSendMessage: Function;

    /**
     * Prop to be invoked when the user wants to set a private recipient.
     */
    _onSetMessageRecipient: Function;

    /**
     * The participant retrieved from Redux by the participantID prop.
     */
    _participant?: IParticipant;

    /**
     * The message that is about to be sent.
     */
    message: Object;

    /**
     * The ID of the participant that we think the message may be intended to.
     */
    participantID: string;
}

/**
 * Abstract class for the dialog displayed to avoid mis-sending private messages.
 */
export class AbstractChatPrivacyDialog extends PureComponent<IProps> {
    /**
     * Instantiates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onSendGroupMessage = this._onSendGroupMessage.bind(this);
        this._onSendPrivateMessage = this._onSendPrivateMessage.bind(this);
    }

    /**
     * Callback to be invoked for cancel action (user wants to send a group message).
     *
     * @returns {boolean}
     */
    _onSendGroupMessage() {
        this.props._onSendMessage(this.props.message);

        return true;
    }

    /**
     * Callback to be invoked for submit action (user wants to send a private message).
     *
     * @returns {void}
     */
    _onSendPrivateMessage() {
        const { message, _onSendMessage, _onSetMessageRecipient, _participant } = this.props;

        _onSetMessageRecipient(_participant);
        _onSendMessage(message);

        return true;
    }
}

/**
 * Maps part of the props of this component to Redux actions.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {IProps}
 */
export function _mapDispatchToProps(dispatch: IStore['dispatch']) {
    return {
        _onSendMessage: (message: string) => {
            dispatch(sendMessage(message, true));
        },

        _onSetMessageRecipient: (participant: IParticipant) => {
            dispatch(setPrivateMessageRecipient(participant));
        }
    };
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {IReduxState} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState, ownProps: IProps) {
    return {
        _participant: getParticipantById(state, ownProps.participantID)
    };
}

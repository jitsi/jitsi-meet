// @flow

import { PureComponent } from 'react';

import { sendMessage, setPrivateMessageRecipient } from '../actions';
import { getParticipantById } from '../../base/participants';

type Props = {

    /**
     * The message that is about to be sent.
     */
    message: Object,

    /**
     * The ID of the participant that we think the message may be intended to.
     */
    participantID: string,

    /**
     * Function to be used to translate i18n keys.
     */
    t: Function,

    /**
     * Prop to be invoked on sending the message.
     */
    _onSendMessage: Function,

    /**
     * Prop to be invoked when the user wants to set a private recipient.
     */
    _onSetMessageRecipient: Function,

    /**
     * The participant retreived from Redux by the participanrID prop.
     */
    _participant: Object
};

/**
 * Abstract class for the dialog displayed to avoid mis-sending private messages.
 */
export class AbstractChatPrivacyDialog extends PureComponent<Props> {
    /**
     * Instantiates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSendGroupMessage = this._onSendGroupMessage.bind(this);
        this._onSendPrivateMessage = this._onSendPrivateMessage.bind(this);
    }

    _onSendGroupMessage: () => boolean;

    /**
     * Callback to be invoked for cancel action (user wants to send a group message).
     *
     * @returns {boolean}
     */
    _onSendGroupMessage() {
        this.props._onSendMessage(this.props.message);

        return true;
    }

    _onSendPrivateMessage: () => boolean;

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
 * @returns {Props}
 */
export function _mapDispatchToProps(dispatch: Function): $Shape<Props> {
    return {
        _onSendMessage: (message: Object) => {
            dispatch(sendMessage(message, true));
        },

        _onSetMessageRecipient: participant => {
            dispatch(setPrivateMessageRecipient(participant));
        }
    };
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object, ownProps: Props): $Shape<Props> {
    return {
        _participant: getParticipantById(state, ownProps.participantID)
    };
}

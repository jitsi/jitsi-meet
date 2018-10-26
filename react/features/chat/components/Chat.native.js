// @flow

import React, { Component } from 'react';

// eslint-disable-next-line react-native/split-platform-components
import { connect } from 'react-redux';
import { translate } from '../../base/i18n';
import { GiftedChat } from 'react-native-gifted-chat';
import { sendMessage } from '../actions';
import { getLocalParticipant } from '../../base/participants';
import type { Dispatch } from 'redux';

/**
 * The type of the React {@code Component} props of {@link Chat}.
 */
type Props = {

    /**
     * The local participant's ID.
     */
    _localParticipant: Object,

    /**
     * All the chat messages in the conference.
     */
    _messages: Array<Object>,

    /**
     * Send a text message.
     *
     * @protected
     */
    _onSendMessage: Function
};


/**
 * The chat page of the mobile (i.e. React Native) application.
 */
class Chat extends Component<Props> {

    /**
       * Initializes a new Conference instance.
       *
       * @param {Object} props - The read-only properties with which the new
       * instance is to be initialized.
       */
    constructor(props: Props) {
        super(props);
        this._onSend = this._onSend.bind(this);
        this._renderMessage = this._renderMessage.bind(this);
    }

    _onSend: (Array<Object>) => void;

    /**
     * Called by {@code render} to create the chat div.
     *
     * @param {string} message - The chat message to display.
     * @param {string} id - The chat message ID to use as a unique key.
     * @returns {Array<ReactElement>}
     */
    _onSend([ message ]) {
        this.props._onSendMessage(message.text);
    }

    _renderMessage: (Object) => void;

    /**
     * Called by {@code _onSubmitMessage} to create the chat message.
     *
     * @param {string} message - The chat message to display.
     * @param {string} id - The chat message ID to use as a unique key.
     * @returns {Array<ReactElement>}
     */
    _renderMessage(message: Object, id: string) {
        return (
            {
                _id: id,
                text: message.message,
                createdAt: new Date(message.timestamp),
                user: {
                    _id: message.id,
                    name: message.displayName
                }
            }
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *x
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {

        const messages = this.props._messages.map(this._renderMessage);

        return (
            <GiftedChat
                messages = { messages.reverse() }
                onSend = { this._onSend }
                user = {{ _id: this.props._localParticipant.id }} />
        );
    }
}

/**
 * Maps redux actions to {@link Chat}'s React
 * {@code Component} props.
 *
 * @param {Function} dispatch - The redux action {@code dispatch} function.
 * @returns {{
 *     _onAddPeople,
 *     _onShareRoom
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch: Dispatch<*>) {
    return {

        /**
         * Dispatch a text message.
         *
         * @private
         * @param {string} text - the text message to be sent
         * @returns {void}
         * @type {Function}
         */
        _onSendMessage(text: string) {
            dispatch(sendMessage(text));
        }
    };
}

/**
 * Maps (parts of) the redux state to the associated {@code Conference}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _messages: Array
 * }}
 */
function _mapStateToProps(state) {
    const { messages } = state['features/chat'];

    return {
        _messages: messages,
        _localParticipant: getLocalParticipant(state)
    };
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(Chat));

// @flow

import React from 'react';
import { toArray } from 'react-emoji-render';

import { translate } from '../../../base/i18n';
import { Linkify } from '../../../base/react';
import { connect } from '../../../base/redux';
import { MESSAGE_TYPE_LOCAL } from '../../constants';
import AbstractChatMessage, { type Props } from '../AbstractChatMessage';

import PrivateMessageButton from './PrivateMessageButton';

/**
 * Renders a single chat message.
 */
class ChatMessage extends AbstractChatMessage<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { message, knocking, t } = this.props;

        const processedMessage = [];

        const txt = this._getMessageText();

        // Tokenize the text in order to avoid emoji substitution for URLs.
        const tokens = txt.split(' ');

        // Content is an array of text and emoji components
        const content = [];

        for (const token of tokens) {
            if (token.includes('://')) {
                // It contains a link, bypass the emojification.
                content.push(token);
            } else {
                content.push(...toArray(token, { className: 'smiley' }));
            }

            content.push(' ');
        }

        content.forEach(i => {
            if (typeof i === 'string' && i !== ' ') {
                processedMessage.push(<Linkify key = { i }>{ i }</Linkify>);
            } else {
                processedMessage.push(i);
            }
        });

        return (
            <div
                className = 'chatmessage-wrapper'
                tabIndex = { -1 }>
                <div
                    className = { `chatmessage ${message.privateMessage ? 'privatemessage' : ''} ${
                        message.challengeResponse ? 'challengeresponsemessage' : ''}` }>
                    <div className = 'replywrapper'>
                        <div className = 'messagecontent'>
                            { this.props.showDisplayName && this._renderDisplayName() }
                            <div className = 'usermessage'>
                                <span className = 'sr-only'>
                                    { this.props.message.displayName === this.props.message.recipient
                                        ? t('chat.messageAccessibleTitleMe')
                                        : t('chat.messageAccessibleTitle',
                                        { user: this.props.message.displayName }) }
                                </span>
                                { processedMessage }
                            </div>
                            { message.privateMessage && this._renderPrivateNotice() }
                            { message.challengeResponse && this._renderLobbyNotice() }
                        </div>
                        { (message.privateMessage || (message.challengeResponse && !knocking))
                            && message.messageType !== MESSAGE_TYPE_LOCAL
                            && (
                                <div
                                    className = { `messageactions ${
                                        message.challengeResponse ? 'challengeresponsemessageactions' : ''}` }>
                                    <PrivateMessageButton
                                        isChallengeResponse = { message.challengeResponse }
                                        participantID = { message.id }
                                        reply = { true }
                                        showLabel = { false } />
                                </div>
                            ) }
                    </div>
                </div>
                { this.props.showTimestamp && this._renderTimestamp() }
            </div>
        );
    }

    _getFormattedTimestamp: () => string;

    _getMessageText: () => string;

    _getPrivateNoticeMessage: () => string;

    _getLobbyNoticeMessage: () => string;

    /**
     * Renders the display name of the sender.
     *
     * @returns {React$Element<*>}
     */
    _renderDisplayName() {
        return (
            <div
                aria-hidden = { true }
                className = 'display-name'>
                { this.props.message.displayName }
            </div>
        );
    }

    /**
     * Renders the message privacy notice.
     *
     * @returns {React$Element<*>}
     */
    _renderPrivateNotice() {
        return (
            <div className = 'privatemessagenotice'>
                { this._getPrivateNoticeMessage() }
            </div>
        );
    }

    /**
     * Renders the lobby message privacy notice.
     *
     * @returns {React$Element<*>}
     */
    _renderLobbyNotice() {
        return (
            <div className = 'privatemessagenotice'>
                { this._getLobbyNoticeMessage() }
            </div>
        );
    }

    /**
     * Renders the time at which the message was sent.
     *
     * @returns {React$Element<*>}
     */
    _renderTimestamp() {
        return (
            <div className = 'timestamp'>
                { this._getFormattedTimestamp() }
            </div>
        );
    }
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: Object): $Shape<Props> {
    const { knocking } = state['features/lobby'];

    return {
        knocking
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));

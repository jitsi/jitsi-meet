// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { Icon, IconCancelSelection } from '../../../base/icons';
import { connect } from '../../../base/redux';
import AbstractMessageRecipient, {
    _mapDispatchToProps,
    _mapStateToProps,
    type Props
} from '../AbstractMessageRecipient';

/**
 * Class to implement the displaying of the recipient of the next message.
 */
class MessageRecipient extends AbstractMessageRecipient<Props> {
    /**
     * Initializes a new {@code MessageRecipient} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onKeyPress = this._onKeyPress.bind(this);
    }

    _onKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e) {
        if (
            (this.props._onRemovePrivateMessageRecipient || this.props._onHideLobbyChatRecipient)
                     && (e.key === ' ' || e.key === 'Enter')
        ) {
            e.preventDefault();
            if (this.props._isLobbyChatActive && this.props._onHideLobbyChatRecipient) {
                this.props._onHideLobbyChatRecipient();
            } else if (this.props._onRemovePrivateMessageRecipient) {
                this.props._onRemovePrivateMessageRecipient();
            }
        }
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _privateMessageRecipient, _isLobbyChatActive,
            _lobbyMessageRecipient, _visible } = this.props;

        if ((!_privateMessageRecipient && !_isLobbyChatActive) || !_visible) {
            return null;
        }

        const { t } = this.props;

        return (
            <div
                className = { _isLobbyChatActive ? 'lobby-chat-recipient' : '' }
                id = 'chat-recipient'
                role = 'alert'>
                <span>
                    { t(_isLobbyChatActive ? 'chat.lobbyChatMessageTo' : 'chat.messageTo', {
                        recipient: _isLobbyChatActive ? _lobbyMessageRecipient : _privateMessageRecipient
                    }) }
                </span>
                <div
                    aria-label = { t('dialog.close') }
                    onClick = { _isLobbyChatActive
                        ? this.props._onHideLobbyChatRecipient : this.props._onRemovePrivateMessageRecipient }
                    onKeyPress = { this._onKeyPress }
                    role = 'button'
                    tabIndex = { 0 }>
                    <Icon
                        src = { IconCancelSelection } />
                </div>
            </div>
        );
    }
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(MessageRecipient));

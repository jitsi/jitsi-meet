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
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _privateMessageRecipient } = this.props;

        if (!_privateMessageRecipient) {
            return null;
        }

        const { t } = this.props;

        return (
            <div id = 'chat-recipient'>
                <span>
                    { t('chat.messageTo', {
                        recipient: _privateMessageRecipient
                    }) }
                </span>
                <div onClick = { this.props._onRemovePrivateMessageRecipient }>
                    <Icon
                        src = { IconCancelSelection } />
                </div>
            </div>
        );
    }
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(MessageRecipient));

// @flow

import React from 'react';
import { Text, TouchableHighlight, View } from 'react-native';

import { translate } from '../../../base/i18n';
import { Icon, IconCancelSelection } from '../../../base/icons';
import { connect } from '../../../base/redux';

import AbstractMessageRecipient, {
    _mapDispatchToProps,
    _mapStateToProps
} from '../AbstractMessageRecipient';

import styles from './styles';

/**
 * Class to implement the displaying of the recipient of the next message.
 */
class MessageRecipient extends AbstractMessageRecipient {
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
            <View style = { styles.messageRecipientContainer }>
                <Text style = { styles.messageRecipientText }>
                    { t('chat.messageTo', {
                        recipient: _privateMessageRecipient
                    }) }
                </Text>
                <TouchableHighlight onPress = { this.props._onRemovePrivateMessageRecipient }>
                    <Icon
                        src = { IconCancelSelection }
                        style = { styles.messageRecipientCancelIcon } />
                </TouchableHighlight>
            </View>
        );
    }
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(MessageRecipient));

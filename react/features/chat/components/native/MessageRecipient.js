// @flow

import React from 'react';
import { Text, TouchableHighlight, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { translate } from '../../../base/i18n';
import { Icon, IconCancelSelection } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { type StyleType } from '../../../base/styles';

import AbstractMessageRecipient, {
    _mapDispatchToProps,
    _mapStateToProps as _abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractMessageRecipient';

type Props = AbstractProps & {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType
};

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
        const { _privateMessageRecipient, _styles } = this.props;

        if (!_privateMessageRecipient) {
            return null;
        }

        const { t } = this.props;

        return (
            <View style = { _styles.messageRecipientContainer }>
                <Text style = { _styles.messageRecipientText }>
                    { t('chat.messageTo', {
                        recipient: _privateMessageRecipient
                    }) }
                </Text>
                <TouchableHighlight onPress = { this.props._onRemovePrivateMessageRecipient }>
                    <Icon
                        src = { IconCancelSelection }
                        style = { _styles.messageRecipientCancelIcon } />
                </TouchableHighlight>
            </View>
        );
    }
}

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        ..._abstractMapStateToProps(state),
        _styles: ColorSchemeRegistry.get(state, 'Chat')
    };
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(MessageRecipient));

// @flow

import React from 'react';
import { Text, TouchableHighlight, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { translate } from '../../../base/i18n';
import { Icon, IconCancelSelection } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { type StyleType } from '../../../base/styles';
import {
    setParams
} from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { setPrivateMessageRecipient } from '../../actions.any';
import AbstractMessageRecipient, {
    type Props as AbstractProps
} from '../AbstractMessageRecipient';

type Props = AbstractProps & {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The participant object set for private messaging.
     */
    privateMessageRecipient: Object,
};

/**
 * Class to implement the displaying of the recipient of the next message.
 */
class MessageRecipient extends AbstractMessageRecipient<Props> {

    /**
     * Constructor of the component.
     *
     * @param {Props} props - The props of the component.
     */
    constructor(props: Props) {
        super(props);

        this._onResetPrivateMessageRecipient = this._onResetPrivateMessageRecipient.bind(this);
    }

    _onResetPrivateMessageRecipient: () => void;

    /**
     * Resets private message recipient from state.
     *
     * @returns {void}
     */
    _onResetPrivateMessageRecipient() {
        const { dispatch } = this.props;

        dispatch(setPrivateMessageRecipient());

        setParams({
            privateMessageRecipient: undefined
        });
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _styles, privateMessageRecipient, t } = this.props;

        if (!privateMessageRecipient) {
            return null;
        }

        return (
            <View style = { _styles.messageRecipientContainer }>
                <Text style = { _styles.messageRecipientText }>
                    { t('chat.messageTo', {
                        recipient: privateMessageRecipient.name
                    }) }
                </Text>
                <TouchableHighlight
                    onPress = { this._onResetPrivateMessageRecipient }>
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
        _styles: ColorSchemeRegistry.get(state, 'Chat')
    };
}

export default translate(connect(_mapStateToProps)(MessageRecipient));

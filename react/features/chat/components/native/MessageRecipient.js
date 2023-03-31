import React from 'react';
import { Text, TouchableHighlight, View } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge } from '../../../base/icons/svg';
import {
    setParams
} from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { setLobbyChatActiveState, setPrivateMessageRecipient } from '../../actions.any';
import AbstractMessageRecipient, {
    type Props as AbstractProps
} from '../AbstractMessageRecipient';

import styles from './styles';


type Props = AbstractProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
 * Is lobby messaging active.
 */
    isLobbyChatActive: boolean,

    /**
     * The participant string for lobby chat messaging.
     */
    lobbyMessageRecipient: Object,

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
        this._onResetLobbyMessageRecipient = this._onResetLobbyMessageRecipient.bind(this);
    }

    _onResetLobbyMessageRecipient: () => void;

    /**
     * Resets lobby message recipient from state.
     *
     * @returns {void}
     */
    _onResetLobbyMessageRecipient() {
        const { dispatch } = this.props;

        dispatch(setLobbyChatActiveState(false));
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
        const {
            isLobbyChatActive,
            lobbyMessageRecipient,
            privateMessageRecipient,
            t
        } = this.props;

        if (isLobbyChatActive) {
            return (
                <View style = { styles.lobbyMessageRecipientContainer }>
                    <Text style = { styles.messageRecipientText }>
                        { t('chat.lobbyChatMessageTo', {
                            recipient: lobbyMessageRecipient.name
                        }) }
                    </Text>
                    <TouchableHighlight
                        onPress = { this._onResetLobbyMessageRecipient }>
                        <Icon
                            src = { IconCloseLarge }
                            style = { styles.messageRecipientCancelIcon } />
                    </TouchableHighlight>
                </View>
            );
        }

        if (!privateMessageRecipient) {
            return null;
        }

        return (
            <View style = { styles.messageRecipientContainer }>
                <Text style = { styles.messageRecipientText }>
                    { t('chat.messageTo', {
                        recipient: privateMessageRecipient.name
                    }) }
                </Text>
                <TouchableHighlight
                    onPress = { this._onResetPrivateMessageRecipient }
                    underlayColor = { 'transparent' }>
                    <Icon
                        src = { IconCloseLarge }
                        style = { styles.messageRecipientCancelIcon } />
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
    const { lobbyMessageRecipient, isLobbyChatActive } = state['features/chat'];

    return {
        isLobbyChatActive,
        lobbyMessageRecipient
    };
}

export default translate(connect(_mapStateToProps)(MessageRecipient));

import React from 'react';
import { Text, TouchableHighlight, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge } from '../../../base/icons/svg';
import { ILocalParticipant } from '../../../base/participants/types';
import {
    setParams
} from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { setLobbyChatActiveState, setPrivateMessageRecipient } from '../../actions.any';
import AbstractMessageRecipient, {
    IProps as AbstractProps
} from '../AbstractMessageRecipient';

import styles from './styles';

interface IProps extends AbstractProps {

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
 * Is lobby messaging active.
 */
    isLobbyChatActive: boolean;

    /**
     * The participant string for lobby chat messaging.
     */
    lobbyMessageRecipient?: {
        id: string;
        name: string;
    } | ILocalParticipant;

    /**
     * The participant object set for private messaging.
     */
    privateMessageRecipient: { name: string; };
}

/**
 * Class to implement the displaying of the recipient of the next message.
 */
class MessageRecipient extends AbstractMessageRecipient<IProps> {

    /**
     * Constructor of the component.
     *
     * @param {IProps} props - The props of the component.
     */
    constructor(props: IProps) {
        super(props);

        this._onResetPrivateMessageRecipient = this._onResetPrivateMessageRecipient.bind(this);
        this._onResetLobbyMessageRecipient = this._onResetLobbyMessageRecipient.bind(this);
    }

    /**
     * Resets lobby message recipient from state.
     *
     * @returns {void}
     */
    _onResetLobbyMessageRecipient() {
        const { dispatch } = this.props;

        dispatch(setLobbyChatActiveState(false));
    }

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
    override render() {
        const {
            isLobbyChatActive,
            lobbyMessageRecipient,
            privateMessageRecipient,
            t
        } = this.props;

        if (isLobbyChatActive) {
            return (
                <View
                    id = 'chat-recipient'
                    style = { styles.lobbyMessageRecipientContainer as ViewStyle }>
                    <Text style = { styles.messageRecipientText }>
                        { t('chat.lobbyChatMessageTo', {
                            recipient: lobbyMessageRecipient?.name
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
            <View
                id = 'message-recipient'
                style = { styles.messageRecipientContainer as ViewStyle }>
                <Text style = { styles.messageRecipientText }>
                    { t('chat.messageTo', {
                        recipient: privateMessageRecipient.name
                    }) }
                </Text>
                <TouchableHighlight
                    id = 'message-recipient-cancel-button'
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
 * @param {any} _ownProps - Component's own props.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const { lobbyMessageRecipient, isLobbyChatActive } = state['features/chat'];

    return {
        isLobbyChatActive,
        lobbyMessageRecipient
    };
}

export default translate(connect(_mapStateToProps)(MessageRecipient));

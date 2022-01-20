// @flow

import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n';
import { Icon, IconChat } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { HIDDEN_EMAILS } from '../../constants';
import { showLobbyChatIcon } from '../../functions';
import AbstractKnockingParticipantList, {
    mapStateToProps as abstractMapStateToProps,
    type Props
} from '../AbstractKnockingParticipantList';

import styles from './styles';

/**
 * Component to render a list for the actively knocking participants.
 */
class KnockingParticipantList extends AbstractKnockingParticipantList {
    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _participants, _visible, _isLobbyChatActive,
            _lobbyMessageRecipient, _lobbyLocalId, _enableLobbyChat, t } = this.props;

        if (!_visible) {
            return null;
        }

        return (
            <ScrollView
                style = { styles.knockingParticipantList }>
                { _participants.map(p => (
                    <View
                        key = { p.id }
                        style = { styles.knockingParticipantListEntry }>
                        <Avatar
                            displayName = { p.name }
                            size = { 48 }
                            url = { p.loadableAvatarUrl } />
                        <View style = { styles.knockingParticipantListDetails }>
                            <Text style = { styles.knockingParticipantListText }>
                                { p.name }
                            </Text>
                            { p.email && !HIDDEN_EMAILS.includes(p.email) && (
                                <Text style = { styles.knockingParticipantListText }>
                                    { p.email }
                                </Text>
                            ) }
                        </View>
                        <TouchableOpacity
                            onPress = { this._onRespondToParticipant(p.id, true) }
                            style = { [
                                styles.knockingParticipantListButton,
                                styles.knockingParticipantListPrimaryButton
                            ] }>
                            <Text style = { styles.knockingParticipantListText }>
                                { t('lobby.allow') }
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress = { this._onRespondToParticipant(p.id, false) }
                            style = { [
                                styles.knockingParticipantListButton,
                                styles.knockingParticipantListSecondaryButton
                            ] }>
                            <Text style = { styles.knockingParticipantListText }>
                                { t('lobby.reject') }
                            </Text>
                        </TouchableOpacity>
                        { showLobbyChatIcon(
                            {
                                participant: p,
                                lobbyLocalId: _lobbyLocalId,
                                isLobbyChatActive: _isLobbyChatActive,
                                lobbyChatRecipient: _lobbyMessageRecipient,
                                enableLobbyChat: _enableLobbyChat
                            }
                        )
                            ? (
                                <TouchableOpacity
                                    onPress = { this._onInitializeLobbyChat(p.id) }
                                    style = { [
                                        styles.knockingParticipantListButton,
                                        styles.knockingParticipantListSecondaryButton
                                    ] }>
                                    <Icon
                                        className = 'icon'
                                        size = { 14 }
                                        src = { IconChat } />
                                </TouchableOpacity>
                            ) : null}
                    </View>
                )) }
            </ScrollView>
        );
    }

    _onRespondToParticipant: (string, boolean) => Function;
    _onInitializeLobbyChat: (string) => Function;
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: Object): $Shape<Props> {
    const abstractProps = abstractMapStateToProps(state);

    return {
        ...abstractProps,

        // On mobile we only show a portion of the list for screen real estate reasons
        _participants: abstractProps._participants.slice(0, 2)
    };
}

export default translate(connect(_mapStateToProps)(KnockingParticipantList));

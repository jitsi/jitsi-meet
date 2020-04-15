// @flow

import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractKnockingParticipantList, { mapStateToProps } from '../AbstractKnockingParticipantList';

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
        const { _participants, t } = this.props;

        // On mobile we only show a portion of the list for screen real estate reasons
        const participants = _participants.slice(0, 2);

        return (
            <ScrollView
                style = { styles.knockingParticipantList }>
                { participants.map(p => (
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
                            { p.email && (
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
                    </View>
                )) }
            </ScrollView>
        );
    }

    _onRespondToParticipant: (string, boolean) => Function;
}

export default translate(connect(mapStateToProps)(KnockingParticipantList));

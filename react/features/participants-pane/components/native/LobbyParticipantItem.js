import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { setKnockingParticipantApproval } from '../../../lobby/actions.native';
import { HIDDEN_EMAILS } from '../../../lobby/constants';

import styles from './styles';


type Props = {

    /**
     * Participant reference.
     */
    participant: Object
};

export const LobbyParticipantItem = ({ participant: p }: Props) => {
    const dispatch = useDispatch();
    const admit = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, true), [ dispatch ]));
    const reject = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, false), [ dispatch ]));

    return (
        <View style = { styles.lobbyParticipantContainer }>
            <Avatar
                displayName = { p.name }
                size = { 32 }
                url = { p.loadableAvatarUrl } />
            <View style = { styles.lobbyParticipantListDetails }>
                <Text style = { styles.lobbyParticipantListText }>
                    { p.name }
                </Text>
                { p.email && !HIDDEN_EMAILS.includes(p.email) && (
                    <Text style = { styles.lobbyParticipantListText }>
                        { p.email }
                    </Text>
                ) }
            </View>
            <View style = { styles.lobbyButtonsContainer }>
                <Button
                    accessibilityLabel = 'lobby.reject'
                    labelKey = 'lobby.reject'
                    onClick = { reject }
                    style = { styles.lobbyButton }
                    type = { BUTTON_TYPES.DESTRUCTIVE } />
                <Button
                    accessibilityLabel = 'lobby.admit'
                    labelKey = 'lobby.admit'
                    onClick = { admit }
                    style = { styles.lobbyButton }
                    type = { BUTTON_TYPES.PRIMARY } />
            </View>
        </View>
    );
};

// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { hideDialog } from '../../../base/dialog';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import {
    Icon, IconClose
} from '../../../base/icons';
import { setKnockingParticipantApproval } from '../../../lobby/actions.native';

import styles from './styles';
type Props = {

    /**
     * Participant reference
     */
    participant: Object
};

export const ContextMenuLobbyParticipantReject = ({ participant: p }: Props) => {
    const dispatch = useDispatch();
    const cancel = useCallback(() => dispatch(hideDialog()), [ dispatch ]);
    const displayName = p.name;
    const reject = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, false), [ dispatch ]));
    const { t } = useTranslation();

    return (
        <BottomSheet
            onCancel = { cancel }
            style = { styles.contextMenuMore }>
            <View
                style = { styles.contextMenuItemSection }>
                <Avatar
                    className = 'participant-avatar'
                    participantId = { p.id }
                    size = { 24 } />
                <View style = { styles.contextMenuItemText }>
                    <Text style = { styles.contextMenuItemName }>
                        { displayName }
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                onPress = { reject }
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 24 }
                    src = { IconClose }
                    style = { styles.contextMenuItemIcon } />
                <Text style = { styles.contextMenuItemText }>{ t('lobby.reject') }</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
};

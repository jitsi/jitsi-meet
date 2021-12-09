// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { hideDialog } from '../../../base/dialog';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import {
    Icon, IconClose
} from '../../../base/icons';
import { setKnockingParticipantApproval } from '../../../lobby/actions.native';
import { getKnockingParticipantsById } from '../../../lobby/functions';

import styles from './styles';
type Props = {

    /**
     * Participant reference.
     */
    participant: Object
};

const ContextMenuLobbyParticipantReject = ({ participant: p }: Props) => {
    const dispatch = useDispatch();
    const knockParticipantsIDArr = useSelector(getKnockingParticipantsById);
    const knockParticipantIsAvailable = knockParticipantsIDArr.find(knockPartId => knockPartId === p.id);
    const cancel = useCallback(() => dispatch(hideDialog()), [ dispatch ]);
    const displayName = p.name;
    const reject = useCallback(() => dispatch(setKnockingParticipantApproval(p.id, false), [ dispatch ]));
    const { t } = useTranslation();

    // eslint-disable-next-line react/no-multi-comp
    const renderMenuHeader = () => (
        <View
            style = { styles.contextMenuItemSectionAvatar }>
            <Avatar
                className = 'participant-avatar'
                participantId = { p.id }
                size = { 24 } />
            <Text style = { styles.contextMenuItemName }>
                { displayName }
            </Text>
        </View>
    );

    return (
        <BottomSheet
            addScrollViewPadding = { false }
            onCancel = { cancel }
            /* eslint-disable-next-line react/jsx-no-bind */
            renderHeader = { renderMenuHeader }
            showSlidingView = { Boolean(knockParticipantIsAvailable) }
            style = { styles.contextMenuMore }>
            <TouchableOpacity
                onPress = { reject }
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 24 }
                    src = { IconClose } />
                <Text style = { styles.contextMenuItemText }>{ t('lobby.reject') }</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
};

export default ContextMenuLobbyParticipantReject;

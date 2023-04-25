import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import Avatar from '../../../base/avatar/components/Avatar';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge } from '../../../base/icons/svg';
import { IParticipant } from '../../../base/participants/types';
import { setKnockingParticipantApproval } from '../../../lobby/actions.native';
import { getKnockingParticipantsById } from '../../../lobby/functions';

import styles from './styles';

interface IProps {

    /**
     * Participant reference.
     */
    participant: IParticipant;
}

const ContextMenuLobbyParticipantReject = ({ participant: p }: IProps) => {
    const dispatch = useDispatch();
    const knockParticipantsIDArr = useSelector(getKnockingParticipantsById);
    const knockParticipantIsAvailable = knockParticipantsIDArr.find(knockPartId => knockPartId === p.id);
    const displayName = p.name;
    const reject = useCallback(() => {
        dispatch(setKnockingParticipantApproval(p.id, false));
    },
    [ dispatch ]);
    const { t } = useTranslation();

    // eslint-disable-next-line react/no-multi-comp
    const renderMenuHeader = () => (
        <View
            style = { styles.contextMenuItemSectionAvatar as ViewStyle }>
            <Avatar
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
            /* eslint-disable-next-line react/jsx-no-bind */
            renderHeader = { renderMenuHeader }
            showSlidingView = { Boolean(knockParticipantIsAvailable) }>
            <TouchableOpacity
                onPress = { reject }
                style = { styles.contextMenuItem as ViewStyle }>
                <Icon
                    size = { 24 }
                    src = { IconCloseLarge } />
                <Text style = { styles.contextMenuItemText }>{ t('lobby.reject') }</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
};

export default ContextMenuLobbyParticipantReject;

// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { createBreakoutRoomsEvent, sendAnalytics } from '../../../../../analytics';
import { hideDialog } from '../../../../../base/dialog/actions';
import BottomSheet from '../../../../../base/dialog/components/native/BottomSheet';
import {
    Icon,
    IconClose,
    IconRingGroup
} from '../../../../../base/icons';
import { isLocalParticipantModerator } from '../../../../../base/participants';
import { closeBreakoutRoom, moveToRoom, removeBreakoutRoom } from '../../../../../breakout-rooms/actions';
import { getBreakoutRoomsConfig } from '../../../../../breakout-rooms/functions';
import styles from '../../../native/styles';

type Props = {

    /**
     * The room for which the menu is open.
     */
    room: Object
}

const BreakoutRoomContextMenu = ({ room }: Props) => {
    const dispatch = useDispatch();
    const closeDialog = useCallback(() => dispatch(hideDialog()), [ dispatch ]);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const { hideJoinRoomButton } = useSelector(getBreakoutRoomsConfig);
    const { t } = useTranslation();

    const onJoinRoom = useCallback(() => {
        sendAnalytics(createBreakoutRoomsEvent('join'));
        dispatch(moveToRoom(room.jid));
        closeDialog();
    }, [ dispatch, room ]);

    const onRemoveBreakoutRoom = useCallback(() => {
        dispatch(removeBreakoutRoom(room.jid));
        closeDialog();
    }, [ dispatch, room ]);

    const onCloseBreakoutRoom = useCallback(() => {
        dispatch(closeBreakoutRoom(room.id));
        closeDialog();
    }, [ dispatch, room ]);

    return (
        <BottomSheet
            addScrollViewPadding = { false }
            onCancel = { closeDialog }
            showSlidingView = { true }>
            {
                !hideJoinRoomButton && (
                    <TouchableOpacity
                        onPress = { onJoinRoom }
                        style = { styles.contextMenuItem }>
                        <Icon
                            size = { 24 }
                            src = { IconRingGroup } />
                        <Text style = { styles.contextMenuItemText }>{t('breakoutRooms.actions.join')}</Text>
                    </TouchableOpacity>
                )
            }
            {!room?.isMainRoom && isLocalModerator
                && (room?.participants && Object.keys(room.participants).length > 0
                    ? <TouchableOpacity
                        onPress = { onCloseBreakoutRoom }
                        style = { styles.contextMenuItem }>
                        <Icon
                            size = { 24 }
                            src = { IconClose } />
                        <Text style = { styles.contextMenuItemText }>{t('breakoutRooms.actions.close')}</Text>
                    </TouchableOpacity>
                    : <TouchableOpacity
                        onPress = { onRemoveBreakoutRoom }
                        style = { styles.contextMenuItem }>
                        <Icon
                            size = { 24 }
                            src = { IconClose } />
                        <Text style = { styles.contextMenuItemText }>{t('breakoutRooms.actions.remove')}</Text>
                    </TouchableOpacity>
                )
            }
        </BottomSheet>
    );
};

export default BreakoutRoomContextMenu;

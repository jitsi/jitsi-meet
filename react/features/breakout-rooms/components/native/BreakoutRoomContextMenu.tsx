import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { createBreakoutRoomsEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { hideSheet, openDialog } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge, IconEdit, IconRingGroup } from '../../../base/icons/svg';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import styles from '../../../participants-pane/components/native/styles';
import { isBreakoutRoomRenameAllowed } from '../../../participants-pane/functions';
import { BREAKOUT_CONTEXT_MENU_ACTIONS as ACTIONS } from '../../../participants-pane/types';
import { closeBreakoutRoom, moveToRoom, removeBreakoutRoom } from '../../actions';
import { getBreakoutRoomsConfig } from '../../functions';
import { IRoom } from '../../types';

import BreakoutRoomNamePrompt from './BreakoutRoomNamePrompt';


/**
 * An array with all possible breakout rooms actions.
 */
const ALL_ACTIONS = [ ACTIONS.JOIN, ACTIONS.REMOVE, ACTIONS.RENAME ];

interface IProps {

    /**
     * The actions that will be displayed.
     */
    actions: Array<ACTIONS>;

    /**
     * The room for which the menu is open.
     */
    room: IRoom;
}

const BreakoutRoomContextMenu = ({ room, actions = ALL_ACTIONS }: IProps) => {
    const dispatch = useDispatch();
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const { hideJoinRoomButton } = useSelector(getBreakoutRoomsConfig);
    const _isBreakoutRoomRenameAllowed = useSelector(isBreakoutRoomRenameAllowed);
    const { t } = useTranslation();

    const onJoinRoom = useCallback(() => {
        sendAnalytics(createBreakoutRoomsEvent('join'));
        dispatch(moveToRoom(room.jid));
        dispatch(hideSheet());
    }, [ dispatch, room ]);

    const onRemoveBreakoutRoom = useCallback(() => {
        dispatch(removeBreakoutRoom(room.jid));
        dispatch(hideSheet());
    }, [ dispatch, room ]);

    const onRenameBreakoutRoom = useCallback(() => {
        dispatch(openDialog(BreakoutRoomNamePrompt, {
            breakoutRoomJid: room.jid,
            initialRoomName: room.name
        }));
        dispatch(hideSheet());
    }, [ dispatch, room ]);

    const onCloseBreakoutRoom = useCallback(() => {
        dispatch(closeBreakoutRoom(room.id));
        dispatch(hideSheet());
    }, [ dispatch, room ]);

    return (
        <BottomSheet
            addScrollViewPadding = { false }
            showSlidingView = { true }>
            {
                !hideJoinRoomButton && actions.includes(ACTIONS.JOIN) && (
                    <TouchableOpacity
                        onPress = { onJoinRoom }
                        style = { styles.contextMenuItem as ViewStyle }>
                        <Icon
                            size = { 24 }
                            src = { IconRingGroup } />
                        <Text style = { styles.contextMenuItemText }>{t('breakoutRooms.actions.join')}</Text>
                    </TouchableOpacity>
                )
            }
            {
                !room?.isMainRoom && actions.includes(ACTIONS.RENAME) && _isBreakoutRoomRenameAllowed
                && <TouchableOpacity
                    onPress = { onRenameBreakoutRoom }
                    style = { styles.contextMenuItem as ViewStyle }>
                    <Icon
                        size = { 24 }
                        src = { IconEdit } />
                    <Text style = { styles.contextMenuItemText }>{t('breakoutRooms.actions.rename')}</Text>
                </TouchableOpacity>
            }
            {
                !room?.isMainRoom && isLocalModerator && actions.includes(ACTIONS.REMOVE)
                && (room?.participants && Object.keys(room.participants).length > 0
                    ? <TouchableOpacity
                        onPress = { onCloseBreakoutRoom }
                        style = { styles.contextMenuItem as ViewStyle }>
                        <Icon
                            size = { 24 }
                            src = { IconCloseLarge } />
                        <Text style = { styles.contextMenuItemText }>{t('breakoutRooms.actions.close')}</Text>
                    </TouchableOpacity>
                    : <TouchableOpacity
                        onPress = { onRemoveBreakoutRoom }
                        style = { styles.contextMenuItem as ViewStyle }>
                        <Icon
                            size = { 24 }
                            src = { IconCloseLarge } />
                        <Text style = { styles.contextMenuItemText }>{t('breakoutRooms.actions.remove')}</Text>
                    </TouchableOpacity>
                )
            }
        </BottomSheet>
    );
};

export default BreakoutRoomContextMenu;

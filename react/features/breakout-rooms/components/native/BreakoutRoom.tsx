import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useDispatch } from 'react-redux';

import { openSheet } from '../../../base/dialog/actions';
import Icon from '../../../base/icons/components/Icon';
import { IconArrowDown, IconArrowUp } from '../../../base/icons/svg';
import { IRoom } from '../../types';

import BreakoutRoomContextMenu from './BreakoutRoomContextMenu';
import BreakoutRoomParticipantItem from './BreakoutRoomParticipantItem';
import styles from './styles';

interface IProps {

    /**
     * Room to display.
     */
    room: IRoom;
}

/**
 * Returns a key for a passed item of the list.
 *
 * @param {Object} item - The participant.
 * @returns {string} - The user ID.
 */
function _keyExtractor(item: any) {
    return item.jid;
}

/**
 * Renders a collapsible breakout room with its participants.
 *
 * @returns {JSX.Element} - The breakout room.
 */
export const BreakoutRoom = ({ room }: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [ collapsed, setCollapsed ] = useState(false);
    const roomParticipantsNr = Object.values(room.participants || {}).length;
    const title = `${room.name || t('breakoutRooms.mainRoom')} (${roomParticipantsNr})`;

    const _toggleCollapsed = useCallback(() => {
        setCollapsed(c => !c);
    }, []);

    const _openContextMenu = useCallback(() => {
        dispatch(openSheet(BreakoutRoomContextMenu, { room }));
    }, [ dispatch, room ]);

    const renderItem = useCallback(({ item: participant }: { item: any; }) => (
        <BreakoutRoomParticipantItem
            item = { participant }
            room = { room } />
    ), [ room ]);

    return (
        <View>
            <TouchableOpacity
                onLongPress = { _openContextMenu }
                onPress = { _toggleCollapsed }
                style = { styles.breakoutRoom as ViewStyle }>
                <View style = { styles.arrowIcon as ViewStyle }>
                    <Icon
                        size = { 18 }
                        src = { collapsed ? IconArrowDown : IconArrowUp } />
                </View>
                <Text style = { styles.listTile as TextStyle }>
                    { title }
                </Text>
            </TouchableOpacity>
            { !collapsed && (
                <FlatList
                    data = { Object.values(room.participants || {}) }
                    keyExtractor = { _keyExtractor }
                    renderItem = { renderItem }
                    scrollEnabled = { false }
                    showsHorizontalScrollIndicator = { false }
                    windowSize = { 2 } />
            ) }
        </View>
    );
};

// @flow

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { openDialog } from '../../../base/dialog';
import { Icon, IconArrowDown, IconArrowUp } from '../../../base/icons';
import { participantMatchesSearch } from '../../../participants-pane/functions';

import BreakoutRoomContextMenu from './BreakoutRoomContextMenu';
import BreakoutRoomParticipantItem from './BreakoutRoomParticipantItem';
import styles from './styles';

type Props = {

    /**
     * Room to display.
     */
    room: Object,

    /**
     * Participants search string.
     */
    searchString: string
}

/**
 * Returns a key for a passed item of the list.
 *
 * @param {Object} item - The participant.
 * @returns {string} - The user ID.
 */
function _keyExtractor(item: Object) {
    return item.jid;
}


export const CollapsibleRoom = ({ room, searchString }: Props) => {
    const dispatch = useDispatch();
    const [ collapsed, setCollapsed ] = useState(false);
    const { t } = useTranslation();
    const _toggleCollapsed = useCallback(() => {
        setCollapsed(!collapsed);
    }, [ collapsed ]);
    const _openContextMenu = useCallback(() => {
        dispatch(openDialog(BreakoutRoomContextMenu, { room }));
    }, [ room ]);

    return (
        <View>
            <TouchableOpacity
                onLongPress = { _openContextMenu }
                onPress = { _toggleCollapsed }
                style = { styles.collapsibleRoom }>
                <TouchableOpacity
                    onPress = { _toggleCollapsed }
                    style = { styles.arrowIcon }>
                    <Icon
                        size = { 18 }
                        src = { collapsed ? IconArrowDown : IconArrowUp } />
                </TouchableOpacity>
                <Text style = { styles.roomName }>
                    {`${room.name || t('breakoutRooms.mainRoom')} (${Object.values(room.participants || {}).length})`}
                </Text>
            </TouchableOpacity>
            {!collapsed && <FlatList
                bounces = { false }
                data = { Object.values(room.participants || {}) }
                horizontal = { false }
                keyExtractor = { _keyExtractor }
                // eslint-disable-next-line react/jsx-no-bind
                renderItem = { ({ item: participant }) => participantMatchesSearch(participant, searchString)
                    && <BreakoutRoomParticipantItem item = { participant } /> }
                showsHorizontalScrollIndicator = { false }
                windowSize = { 2 } />}
        </View>
    );
};

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import { useDispatch } from 'react-redux';

import { openSheet } from '../../../base/dialog/actions';
import { IRoom } from '../../types';
import { participantMatchesSearch } from '../../../participants-pane/functions';
import CollapsibleList from '../../../participants-pane/components/native/CollapsibleList';

import BreakoutRoomContextMenu from './BreakoutRoomContextMenu';
import BreakoutRoomParticipantItem from './BreakoutRoomParticipantItem';

interface IProps {

    /**
     * Room to display.
     */
    room: IRoom;

    roomId: string;

    /**
     * Participants search string.
     */
    searchString: string;
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

export const CollapsibleRoom = ({ room, roomId, searchString }: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _openContextMenu = useCallback(() => {
        dispatch(openSheet(BreakoutRoomContextMenu, { room }));
    }, [ room ]);
    const roomParticipantsNr = Object.values(room.participants || {}).length;
    const title
        = `${room.name
    || t('breakoutRooms.mainRoom')} (${roomParticipantsNr})`;

    return (
        <CollapsibleList
            onLongPress = { _openContextMenu }
            title = { title }>
            <FlatList
                data = { Object.values(room.participants || {}) }
                keyExtractor = { _keyExtractor }
                listKey = { roomId }
                nestedScrollEnabled
                // eslint-disable-next-line react/jsx-no-bind, no-confusing-arrow
                renderItem = { ({ item: participant }) => participantMatchesSearch(participant, searchString)
                    ? <BreakoutRoomParticipantItem
                        item = { participant }
                        room = { room } />
                    : null }
                scrollEnabled = { false }
                showsHorizontalScrollIndicator = { false }
                windowSize = { 2 } />
        </CollapsibleList>
    );
};

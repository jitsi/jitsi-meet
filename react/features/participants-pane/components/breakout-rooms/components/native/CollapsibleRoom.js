// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import { useDispatch } from 'react-redux';

import { openDialog } from '../../../../../base/dialog';
import { participantMatchesSearch } from '../../../../functions';
import CollapsibleList from '../../../native/CollapsibleList';
import styles from '../../../native/styles';

import BreakoutRoomContextMenu from './BreakoutRoomContextMenu';
import BreakoutRoomParticipantItem from './BreakoutRoomParticipantItem';

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
    const { t } = useTranslation();
    const _openContextMenu = useCallback(() => {
        dispatch(openDialog(BreakoutRoomContextMenu, { room }));
    }, [ room ]);
    const roomParticipantsNr = Object.values(room.participants || {}).length;
    const title
        = `${room.name
    || t('breakoutRooms.mainRoom')} (${roomParticipantsNr})`;

    // Regarding the fact that we have 3 sections, we apply
    // a certain height percentage for every section in order for all to fit
    // inside the participants pane container
    const containerStyle
        = roomParticipantsNr > 2 && styles.collapsibleRoomContainer;

    return (
        <CollapsibleList
            containerStyle = { containerStyle }
            onLongPress = { _openContextMenu }
            title = { title }>
            <FlatList
                bounces = { false }
                data = { Object.values(room.participants || {}) }
                horizontal = { false }
                keyExtractor = { _keyExtractor }
                // eslint-disable-next-line react/jsx-no-bind
                renderItem = { ({ item: participant }) => participantMatchesSearch(participant, searchString)
                    && <BreakoutRoomParticipantItem item = { participant } /> }
                scrollEnabled = { true }
                showsHorizontalScrollIndicator = { false }
                windowSize = { 2 } />
        </CollapsibleList>
    );
};

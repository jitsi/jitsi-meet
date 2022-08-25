import React, { useState } from 'react';
import { FlatList } from 'react-native';
import { useSelector } from 'react-redux';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { isLocalParticipantModerator } from '../../../base/participants';
import { equals } from '../../../base/redux';
import {
    getBreakoutRooms,
    getCurrentRoomId,
    isAddBreakoutRoomButtonVisible,
    isAutoAssignParticipantsVisible,
    isInBreakoutRoom
} from '../../../breakout-rooms/functions';
import { getKnockingParticipants } from '../../../lobby/functions';
import {
    AddBreakoutRoomButton,
    AutoAssignButton,
    LeaveBreakoutRoomButton
} from '../breakout-rooms/components/native';
import { CollapsibleRoom } from '../breakout-rooms/components/native/CollapsibleRoom';

import LobbyParticipantList from './LobbyParticipantList';
import MeetingParticipantList from './MeetingParticipantList';
import ParticipantsPaneFooter from './ParticipantsPaneFooter';
import styles from './styles';

/**
 * Key extractor for the flatlist.
 *
 * @param {Object} item - The flatlist item that we need the key to be
 * generated for.
 * @param {number} index - The index of the element.
 * @returns {string}
 */
function _keyExtractor(item, index) {
    return `key_${index}`;
}

/**
 * Participants pane.
 *
 * @returns {React$Element<any>}
 */
const ParticipantsPane = () => {
    const [ searchString, setSearchString ] = useState('');
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const { conference } = useSelector(state => state['features/base/conference']);
    const _isBreakoutRoomsSupported = conference?.getBreakoutRooms()?.isSupported();
    const currentRoomId = useSelector(getCurrentRoomId);
    const rooms: Array<Object> = Object.values(useSelector(getBreakoutRooms, equals))
        .filter((room: Object) => room.id !== currentRoomId)
        .sort((p1: Object, p2: Object) => (p1?.name || '').localeCompare(p2?.name || ''));
    const inBreakoutRoom = useSelector(isInBreakoutRoom);
    const showAddBreakoutRoom = useSelector(isAddBreakoutRoomButtonVisible);
    const showAutoAssign = useSelector(isAutoAssignParticipantsVisible);
    const lobbyParticipants = useSelector(getKnockingParticipants);
    const renderHeader = () => (
        <>
            <LobbyParticipantList />
            <MeetingParticipantList
                breakoutRooms = { rooms }
                isLocalModerator = { isLocalModerator }
                lobbyParticipants = { lobbyParticipants }
                searchString = { searchString }
                setSearchString = { setSearchString } />
        </>
    );
    const renderFooter = () => (
        <>
            {
                inBreakoutRoom && <LeaveBreakoutRoomButton />
            }
            {
                showAutoAssign && <AutoAssignButton />
            }
            {
                showAddBreakoutRoom && <AddBreakoutRoomButton />
            }
            {
                _isBreakoutRoomsSupported
                && rooms.map(room => (
                    <CollapsibleRoom
                        key = { room.id }
                        room = { room }
                        searchString = { searchString } />
                ))
            }
        </>
    );

    return (
        <JitsiScreen
            footerComponent = { isLocalModerator && ParticipantsPaneFooter }
            style = { styles.participantsPaneContainer }>
            <FlatList

                /* eslint-disable-next-line react/jsx-no-bind */
                ListFooterComponent = { renderFooter }

                /* eslint-disable-next-line react/jsx-no-bind */
                ListHeaderComponent = { renderHeader }
                data = { null }
                keyExtractor = { _keyExtractor }

                // For FlatList as a nested list of any other FlatList or SectionList
                // we have to pass a unique value to this prop
                listKey = { 'Participants' }
                renderItem = { null } />
        </JitsiScreen>
    );
};

export default ParticipantsPane;

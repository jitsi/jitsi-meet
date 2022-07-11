// @flow

import React, { useState } from 'react';
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

    return (
        <JitsiScreen
            footerComponent = { isLocalModerator && ParticipantsPaneFooter }
            style = { styles.participantsPaneContainer }>
            <LobbyParticipantList />
            <MeetingParticipantList
                breakoutRooms = { rooms }
                isLocalModerator = { isLocalModerator }
                lobbyParticipants = { lobbyParticipants }
                searchString = { searchString }
                setSearchString = { setSearchString } />
            {
                showAutoAssign && <AutoAssignButton />
            }
            {
                inBreakoutRoom && <LeaveBreakoutRoomButton />
            }
            {
                _isBreakoutRoomsSupported
                && rooms.map(room => (<CollapsibleRoom
                    key = { room.id }
                    room = { room }
                    searchString = { searchString } />))
            }
            {
                showAddBreakoutRoom && <AddBreakoutRoomButton />
            }
        </JitsiScreen>
    );
};

export default ParticipantsPane;

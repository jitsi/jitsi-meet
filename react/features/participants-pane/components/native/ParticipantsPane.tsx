import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { equals } from '../../../base/redux/functions';
import {
    getBreakoutRooms,
    getCurrentRoomId,
    isAddBreakoutRoomButtonVisible,
    isAutoAssignParticipantsVisible,
    isInBreakoutRoom
} from '../../../breakout-rooms/functions';
import { getKnockingParticipants } from '../../../lobby/functions';
import AddBreakoutRoomButton from '../breakout-rooms/components/native/AddBreakoutRoomButton';
import AutoAssignButton from '../breakout-rooms/components/native/AutoAssignButton';
import { CollapsibleRoom } from '../breakout-rooms/components/native/CollapsibleRoom';
import LeaveBreakoutRoomButton from '../breakout-rooms/components/native/LeaveBreakoutRoomButton';

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
    const { conference } = useSelector((state: IReduxState) => state['features/base/conference']);
    const _isBreakoutRoomsSupported = conference?.getBreakoutRooms()?.isSupported();
    const currentRoomId = useSelector(getCurrentRoomId);
    const rooms = Object.values(useSelector(getBreakoutRooms, equals))
        .filter(room => room.id !== currentRoomId)
        .sort((p1, p2) => (p1?.name || '').localeCompare(p2?.name || ''));
    const inBreakoutRoom = useSelector(isInBreakoutRoom);
    const showAddBreakoutRoom = useSelector(isAddBreakoutRoomButtonVisible);
    const showAutoAssign = useSelector(isAutoAssignParticipantsVisible);
    const lobbyParticipants = useSelector(getKnockingParticipants);

    return (
        <JitsiScreen
            footerComponent = { isLocalModerator ? ParticipantsPaneFooter : undefined }
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

// @flow

import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { openDialog, openSheet } from '../../../base/dialog';
import { IconHorizontalPoints } from '../../../base/icons';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { isLocalParticipantModerator } from '../../../base/participants';
import Button from '../../../base/react/components/native/Button';
import IconButton from '../../../base/react/components/native/IconButton';
import { BUTTON_TYPES } from '../../../base/react/constants';
import { equals } from '../../../base/redux';
import {
    getBreakoutRooms,
    getCurrentRoomId,
    isAddBreakoutRoomButtonVisible,
    isAutoAssignParticipantsVisible,
    isInBreakoutRoom
} from '../../../breakout-rooms/functions';
import { getKnockingParticipants } from '../../../lobby/functions';
import MuteEveryoneDialog
    from '../../../video-menu/components/native/MuteEveryoneDialog';
import { isMoreActionsVisible, isMuteAllVisible } from '../../functions';
import {
    AddBreakoutRoomButton,
    AutoAssignButton,
    LeaveBreakoutRoomButton
} from '../breakout-rooms/components/native';
import { CollapsibleRoom } from '../breakout-rooms/components/native/CollapsibleRoom';

import { ContextMenuMore } from './ContextMenuMore';
import LobbyParticipantList from './LobbyParticipantList';
import MeetingParticipantList from './MeetingParticipantList';
import styles from './styles';

/**
 * Participant pane.
 *
 * @returns {React$Element<any>}
 */
const ParticipantsPane = () => {
    const dispatch = useDispatch();
    const [ searchString, setSearchString ] = useState('');
    const openMoreMenu = useCallback(() => dispatch(openSheet(ContextMenuMore)), [ dispatch ]);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const muteAll = useCallback(() => dispatch(openDialog(MuteEveryoneDialog)),
        [ dispatch ]);
    const { conference } = useSelector(state => state['features/base/conference']);
    const _isBreakoutRoomsSupported = conference?.getBreakoutRooms()?.isSupported();
    const currentRoomId = useSelector(getCurrentRoomId);
    const rooms: Array<Object> = Object.values(useSelector(getBreakoutRooms, equals))
        .filter((room: Object) => room.id !== currentRoomId)
        .sort((p1: Object, p2: Object) => (p1?.name || '').localeCompare(p2?.name || ''));
    const inBreakoutRoom = useSelector(isInBreakoutRoom);
    const showAddBreakoutRoom = useSelector(isAddBreakoutRoomButtonVisible);
    const showAutoAssign = useSelector(isAutoAssignParticipantsVisible);
    const showMoreActions = useSelector(isMoreActionsVisible);
    const showMuteAll = useSelector(isMuteAllVisible);
    const lobbyParticipants = useSelector(getKnockingParticipants);

    return (
        <JitsiScreen style = { styles.participantsPaneContainer }>
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
            {
                isLocalModerator
                && <View style = { styles.participantsPaneFooter }>
                    {
                        showMuteAll && (
                            <Button
                                accessibilityLabel = 'participantsPane.actions.muteAll'
                                label = 'participantsPane.actions.muteAll'
                                onPress = { muteAll }
                                type = { BUTTON_TYPES.SECONDARY } />
                        )
                    }
                    {
                        showMoreActions && (
                            <IconButton
                                onPress = { openMoreMenu }
                                src = { IconHorizontalPoints }
                                style = { styles.moreButton }
                                type = { BUTTON_TYPES.SECONDARY } />
                        )
                    }
                </View>
            }
        </JitsiScreen>
    );
};

export default ParticipantsPane;

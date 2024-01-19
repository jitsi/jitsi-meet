import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
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
} from '../../functions';

import AddBreakoutRoomButton from './AddBreakoutRoomButton';
import AutoAssignButton from './AutoAssignButton';
import { CollapsibleRoom } from './CollapsibleRoom';
import LeaveBreakoutRoomButton from './LeaveBreakoutRoomButton';
import styles from './styles';


const BreakoutRooms = () => {
    const currentRoomId = useSelector(getCurrentRoomId);
    const inBreakoutRoom = useSelector(isInBreakoutRoom);
    const isBreakoutRoomsSupported = useSelector((state: IReduxState) =>
        state['features/base/conference'].conference?.getBreakoutRooms()?.isSupported());
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const keyExtractor = useCallback((e: undefined, i: number) => i.toString(), []);
    const rooms = Object.values(useSelector(getBreakoutRooms, equals))
        .filter(room => room.id !== currentRoomId)
        .sort((p1, p2) => (p1?.name || '').localeCompare(p2?.name || ''));
    const showAddBreakoutRoom = useSelector(isAddBreakoutRoomButtonVisible);
    const showAutoAssign = useSelector(isAutoAssignParticipantsVisible);

    return (
        <JitsiScreen
            footerComponent = { isLocalModerator && showAddBreakoutRoom
                ? AddBreakoutRoomButton : undefined }
            style = { styles.breakoutRoomsContainer }>

            { /* Fixes warning regarding nested lists */ }
            <FlatList

                /* eslint-disable react/jsx-no-bind */
                ListHeaderComponent = { () => (
                    <>
                        { showAutoAssign && <AutoAssignButton /> }
                        { inBreakoutRoom && <LeaveBreakoutRoomButton /> }
                        {
                            isBreakoutRoomsSupported
                            && rooms.map(room => (<CollapsibleRoom
                                key = { room.id }
                                room = { room }
                                roomId = { room.id } />))
                        }
                    </>
                ) }
                data = { [] as ReadonlyArray<undefined> }
                keyExtractor = { keyExtractor }
                renderItem = { null }
                windowSize = { 2 } />
        </JitsiScreen>
    );
};

export default BreakoutRooms;

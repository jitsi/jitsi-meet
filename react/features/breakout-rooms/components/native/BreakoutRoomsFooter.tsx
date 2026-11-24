import React from 'react';
import { useSelector } from 'react-redux';

import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { isAddBreakoutRoomButtonVisible, isInBreakoutRoom } from '../../functions';

import AddBreakoutRoomButton from './AddBreakoutRoomButton';
import LeaveBreakoutRoomButton from './LeaveBreakoutRoomButton';

const BreakoutRoomsFooter = () => {
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const showAddBreakoutRoom = useSelector(isAddBreakoutRoomButtonVisible);
    const inBreakoutRoom = useSelector(isInBreakoutRoom);

    return (
        <>
            { isLocalModerator && showAddBreakoutRoom && <AddBreakoutRoomButton /> }
            { inBreakoutRoom && <LeaveBreakoutRoomButton /> }
        </>
    );
};

export default BreakoutRoomsFooter;

import { size } from 'lodash-es';

import { IStateful } from '../base/app/types';
import { isLocalParticipantModerator } from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { getBreakoutRooms, getBreakoutRoomsConfig } from '../breakout-rooms/functions';

export const isAutoBreakoutRoomButtonVisible = (stateful: IStateful) => {
    const state = toState(stateful);
    const isLocalModerator = isLocalParticipantModerator(state);
    const { conference } = state['features/base/conference'];
    const isBreakoutRoomsSupported = conference?.getBreakoutRooms()?.isSupported();
    const { hideAutoAssignButton } = getBreakoutRoomsConfig(state);

    return isLocalModerator && isBreakoutRoomsSupported && !hideAutoAssignButton;
};

export const isCloseAllBreakoutRoomVisible = (stateful: IStateful) => {
    const state = toState(stateful);
    const isLocalModerator = isLocalParticipantModerator(state);
    const { conference } = state['features/base/conference'];
    const isBreakoutRoomsSupported = conference?.getBreakoutRooms()?.isSupported();
    const rooms = getBreakoutRooms(state);

    return isLocalModerator && isBreakoutRoomsSupported && size(rooms) > 1;
};

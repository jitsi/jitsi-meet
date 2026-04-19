import { reduce, size } from 'lodash-es';

import { IStateful } from '../base/app/types';
import { getParticipantById, isLocalParticipantModerator } from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import { toState } from '../base/redux/functions';
import { getRoomsInfo } from '../breakout-rooms/functions';
import { IRoomInfo } from '../breakout-rooms/types';

import { FEATURE_KEY } from './constants';
import { IBreakoutPayload } from './types';

export const isEnablePreBreakout = (search = location.search) => {
    return search.includes('pre-breakout=1') || search.includes('pre-breakout');
};

export const getPresetBreakoutRoomsConfig = (stateful: IStateful) => {
    const state = toState(stateful);
    const { presetupBreakoutRooms = {} } = state['features/base/config'];

    return presetupBreakoutRooms;
};

export const getAllParticipants = (stateful: IStateful) => {
    const { rooms } = getRoomsInfo(stateful);

    return reduce<IRoomInfo, IParticipant[]>(rooms, (result, room) => {
        room.participants.forEach(participant => {
            const ids = participant.id.split('/');
            const item = getParticipantById(stateful, ids.length > 1 ? ids[1] : participant.id);

            result.push(item ?? participant);
        });

        return result;
    }, []);
};

export const isPresetBreakoutRoomButtonVisible = (stateful: IStateful) => {
    const state = toState(stateful);
    const isLocalModerator = isLocalParticipantModerator(state);
    const { conference } = state['features/base/conference'];
    const isBreakoutRoomsSupported = conference?.getBreakoutRooms()?.isSupported();
    const { enablePresetBreakoutRoom } = state['features/breakout-room-presetup'] ?? {};
    const { hideUsePresetRoomButton } = getPresetBreakoutRoomsConfig(state);
    const allParticipantsSize = size(getAllParticipants(stateful));

    return isLocalModerator && isBreakoutRoomsSupported && enablePresetBreakoutRoom && !hideUsePresetRoomButton && allParticipantsSize > 3;
};

export const getPresetupBreakoutRoomsConfig = (stateful: IStateful) => {
    const state = toState(stateful);
    const { presetupBreakoutRooms = {} } = state['features/base/config'];

    return presetupBreakoutRooms;
};

export const getPresetBreakoutRoomData = (stateful: IStateful): IBreakoutPayload => toState(stateful)[FEATURE_KEY]?.presetRoomData;


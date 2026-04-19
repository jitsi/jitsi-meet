import { filter, isEmpty, map, size } from 'lodash-es';

import { IStore } from '../app/types';
import { autoAssignToBreakoutRooms, createBreakoutRoom, removeBreakoutRoom, sendParticipantToRoom } from '../breakout-rooms/actions';
import { getBreakoutRooms, getMainRoom } from '../breakout-rooms/functions';
import logger from '../breakout-rooms/logger';
import { IRoomInfoParticipant } from '../breakout-rooms/types';

import { _AVAILABLE_AUTO_SET_BREAKOUT_ROOMS, _AVAILABLE_REMOVE_ALL_BREAKOUT_ROOMS, _AVAILABLE_REMOVE_ALL_BREAKOUT_ROOMS_AND_ADD } from './actionTypes';
import { IAutosetupBreakoutRoomsState } from './reducer';

export function availableAutoToSetup(value: boolean) {
    return {
        type: _AVAILABLE_AUTO_SET_BREAKOUT_ROOMS,
        payload: value
    };
}

export function availableRemoveAllRooms(value: boolean) {
    return {
        type: _AVAILABLE_REMOVE_ALL_BREAKOUT_ROOMS,
        payload: value
    };
}

export function availableReassign(value: IAutosetupBreakoutRoomsState['availableToReassign']) {
    return {
        type: _AVAILABLE_REMOVE_ALL_BREAKOUT_ROOMS_AND_ADD,
        payload: value
    };
}

export function executeAutoBreakoutRoom() {
    return async (dispatch: IStore['dispatch'], _getState: IStore['getState']) => {
        // even if waiting for the middleware callback, it still takes some time to create rooms
        await new Promise(r => setTimeout(r, 100));
        dispatch(autoAssignToBreakoutRooms());
    };
}

export function sendAllParticipantsToMainRoom() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const mainRoom = getMainRoom(getState);
        const rooms = getBreakoutRooms(getState);
        const toCleanRooms = map(rooms, room => room).filter(room => !room.isMainRoom);

        const toSendMainRoomParticipants = toCleanRooms.reduce<Array<Pick<IRoomInfoParticipant, 'jid'>>>((result, room) => ([ ...result, ...Object.values(room.participants) ]), []);

        const isEmptyToSend = isEmpty(toSendMainRoomParticipants);

        if (!isEmptyToSend) {
            await toSendMainRoomParticipants.map(p => dispatch(sendParticipantToRoom(p.jid, mainRoom!.id)));
        }

        return {
            isEmptyToSend
        };
    };
}

export function triggerRemoveAllRooms() {
    return async (dispatch: IStore['dispatch'], _getState: IStore['getState']) => {
        const { isEmptyToSend } = await dispatch(sendAllParticipantsToMainRoom());

        if (isEmptyToSend) {
            dispatch(executeRemoveAllRooms());
        } else {
            dispatch(availableRemoveAllRooms(true));
        }
    };
}

export function executeRemoveAllRooms() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        dispatch(availableRemoveAllRooms(false));

        const rooms = getBreakoutRooms(getState);
        const toCleanRooms = map(rooms, room => room).filter(room => !room.isMainRoom);

        return Promise.all(toCleanRooms.map(room => dispatch(removeBreakoutRoom(room.jid))));
    };
}

export function triggerReassign(params: { assignRoomCount: number; }) {
    return async (dispatch: IStore['dispatch'], _getState: IStore['getState']) => {
        const { isEmptyToSend } = await dispatch(sendAllParticipantsToMainRoom());

        if (isEmptyToSend) {
            await dispatch(prepareReassignRemove(params));
        } else {
            dispatch(availableReassign({
                participantsReady: true,
                removeReady: false,
                addReady: false,
                assignRoomCount: params.assignRoomCount,
            }));
        }
    };
}

export function prepareReassignRemove(params: { assignRoomCount: number; }) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const rooms = getBreakoutRooms(getState);

        await map(rooms, room => room).filter(room => !room.isMainRoom).map(room => dispatch(removeBreakoutRoom(room.jid)));

        dispatch(availableReassign({
            participantsReady: true,
            removeReady: true,
            addReady: false,
            assignRoomCount: params.assignRoomCount,
        }));
    };
}

export function launchAutoSetup(params: { assignRoomCount: number; }) {
    const { assignRoomCount } = params;

    return async (dispatch: IStore['dispatch'], getState: IStore['getState'],) => {
        const state = getState();

        const rooms = getBreakoutRooms(state);
        const subRoomsSize = size(filter(rooms, room => !room.isMainRoom));

        // Check whether the number of rooms to assign is valid
        if (!assignRoomCount || isNaN(assignRoomCount) || assignRoomCount < 1) {
            return;
        }

        logger.debug('[GTS] AutoDiscuss click', { shouldAssignRoomCount: assignRoomCount, subRoomsSize });

        if (assignRoomCount > subRoomsSize) {
            dispatch(prepareReassignAdd({
                assignRoomCount: assignRoomCount - subRoomsSize
            }));
        } else if (assignRoomCount === subRoomsSize) {
            dispatch(autoAssignToBreakoutRooms());

        } else {
            // we'll close all rooms if there is too many, and then recreate
            dispatch(triggerReassign({ assignRoomCount: assignRoomCount }));
        }
    };
}

export function prepareReassignAdd(params: { assignRoomCount: number; }) {
    return async (dispatch: IStore['dispatch'], _getState: IStore['getState']) => {
        await Promise.all(Array.from({ length: params.assignRoomCount }, () => dispatch(createBreakoutRoom())));

        dispatch(availableReassign({
            participantsReady: true,
            removeReady: true,
            addReady: true,
            assignRoomCount: params.assignRoomCount,
        }));
    };
}

export function executeReassign() {
    return async (dispatch: IStore['dispatch'], _getState: IStore['getState']) => {
        dispatch(availableReassign({
            participantsReady: false,
            removeReady: false,
            addReady: false,
            assignRoomCount: -1,
        }));

        await new Promise(r => setTimeout(r, 100));
        dispatch(autoAssignToBreakoutRooms());
    };
}


import { filter, find, forEach, isEmpty, map, reduce } from 'lodash-es';

import { IStore } from '../app/types';
import { IParticipant } from '../base/participants/types';
import { createBreakoutRoom, removeBreakoutRoom, sendParticipantToRoom } from '../breakout-rooms/actions';
import { getBreakoutRooms, getMainRoom } from '../breakout-rooms/functions';
import logger from '../breakout-rooms/logger';
import type { IRoom, IRoomInfoParticipant } from '../breakout-rooms/types';

import { _AVAILABLE_TO_SET_BREAKOUT_ROOMS, _ENABlE_PRESET_BREAKOUT_ROOMS, _PRESET_BREAKOUT_ROOMS_ADD_LISTENER, _PRESET_BREAKOUT_ROOMS_CLEAN_LISTENER, _UPDATE_PRESET_BREAKOUT_ROOMS } from './actionTypes';
import { getAllParticipants, getPresetBreakoutRoomData } from './functions';
import type { IPresetBreakoutRoomsState } from './reducer';
import type { IBreakoutPayload, IMessageData } from './types';

export function enablePresetFeature(value: boolean) {
    return {
        type: _ENABlE_PRESET_BREAKOUT_ROOMS,
        payload: value
    };
}

export function updatePresetBreakoutRoom(data: IBreakoutPayload) {
    return {
        type: _UPDATE_PRESET_BREAKOUT_ROOMS,
        payload: data
    };
}

export function retrievePresetBreakoutRoom() {
    return (dispatch: IStore['dispatch'], _getState: IStore['getState']) => {
        if (!window.opener) {
            return;
        }

        window.opener.postMessage({ type: 'Request-MeetingBreakoutRoomParams' }, '*');
        let messageListener: ((event: MessageEvent<IMessageData<IBreakoutPayload>>) => void) | undefined = event => {
            const { type: msgType, payload } = event.data ?? {};

            if (msgType === 'Response-MeetingBreakoutRoomParams') {
                logger.debug('[GTS-PBR] getBreakoutConfig data', payload);

                dispatch({
                    type: _UPDATE_PRESET_BREAKOUT_ROOMS,
                    payload: payload
                });

                (event.source as unknown as Window)?.postMessage({ type: 'Received-MeetingBreakoutRoomParams' }, event.origin);

                dispatch({
                    type: _PRESET_BREAKOUT_ROOMS_CLEAN_LISTENER
                });
            }
        };

        window.addEventListener('message', messageListener);
        const clean = () => {
            if (!messageListener) {
                return;
            }
            window.removeEventListener('message', messageListener);
            messageListener = undefined;
        };

        dispatch({
            type: _PRESET_BREAKOUT_ROOMS_ADD_LISTENER,
            payload: clean
        });
    };
}

export function cleanListener() {
    return {
        type: _PRESET_BREAKOUT_ROOMS_CLEAN_LISTENER
    };
}

export function availableToSetup(value: IPresetBreakoutRoomsState['availableToSetup']) {
    return {
        type: _AVAILABLE_TO_SET_BREAKOUT_ROOMS,
        payload: value
    };
}

export function triggerBreakoutRoom() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { meetingData } = getPresetBreakoutRoomData(getState);
        const presetSubRoomNameList = filter(meetingData, room => !room.isMainRoom).map(room => room.name as string);

        logger.debug('[GTS-PBR] triggerBreakoutRoom', { meetingData });

        // 1、Send participants who are not in the preset rooms back to the main room.
        const toCleanSubRooms = filter(getBreakoutRooms(getState), room => !room.isMainRoom).filter(room => !presetSubRoomNameList.includes(room.name));

        const mainRoom = getMainRoom(getState);

        let toSendMainParticipants;

        if (mainRoom) {
            toSendMainParticipants = reduce(toCleanSubRooms, (result: Array<Pick<IRoomInfoParticipant, 'displayName' | 'jid'>>, room) => ([ ...result, ...map(room.participants, participant => participant) ]), []);

            await toSendMainParticipants.map(p => {
                logger.debug('[GTS] triggerBreakoutRoom: sending participant to main room', p);

                return dispatch(sendParticipantToRoom(p.jid, mainRoom.id));
            });
        }

        if (isEmpty(toSendMainParticipants)) {
            dispatch(prepareBreakoutRoom());
        } else {
            dispatch(availableToSetup({
                participantsReady: true,
                cleanRoomReady: true,
                createRoomReady: false,
            }));
        }
    };
}

export function prepareBreakoutRoom() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { meetingData } = getPresetBreakoutRoomData(getState);
        const presetSubRoomNameList = filter(meetingData, room => !room.isMainRoom).map(room => room.name as string);

        // 2、Filter out the rooms that need to be newly created according to the current grouping situation
        const currentSubRooms = filter(getBreakoutRooms(getState), room => !room.isMainRoom);
        const currentSubRoomNameList = currentSubRooms.map(room => room.name);
        const toCreateSubRoomNameList = presetSubRoomNameList.filter(name => !currentSubRoomNameList.includes(name));

        await Promise.all(toCreateSubRoomNameList.map(name => dispatch(createBreakoutRoom(name))));

        logger.debug('[GTS-PBR] prepareBreakoutRoom ALL completed', {
            toCreateSubRooms: toCreateSubRoomNameList
        });

        // 3、Wait for the middleware callback and move the people to the sub-room, that is, executeBreakoutRoom()
        if (isEmpty(toCreateSubRoomNameList)) {
            dispatch(executeBreakoutRoom());
        } else {
            dispatch(availableToSetup({
                participantsReady: true,
                cleanRoomReady: true,
                createRoomReady: true,
            }));
        }
    };
}

export function executeBreakoutRoom() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { meetingData } = getPresetBreakoutRoomData(getState);

        dispatch(availableToSetup({
            participantsReady: false,
            cleanRoomReady: false,
            createRoomReady: false,
        }));

        // Even if waiting for the middleware callback, it still takes some time to obtain the current room information.
        await new Promise(r => setTimeout(r, 100));
        const currentSubRooms = getBreakoutRooms(getState);
        const allParticipants = getAllParticipants(getState);

        logger.debug('[GTS-PBR] executeSetBreakoutRoom', { currentSubRooms, allParticipants, meetingData });

        // 4、According to the pre-breakout data, send participant to the corresponding room.
        Promise.all(
            reduce(meetingData, (result: Array<{
                participant: IParticipant;
                room: IRoom;
            }>, meetingRoom) => {
                const targetRoom = meetingRoom.isMainRoom ? getMainRoom(getState) : find(currentSubRooms, roomItem => roomItem.name === meetingRoom.name);

                if (!targetRoom) {
                    return result;
                }

                forEach(meetingRoom.participants, item => {
                    const participant = find(allParticipants, p => {
                        // Email format: userid@idigest.app
                        if (p.email) {
                            const [ userId ] = p.email.split('@');

                            return `${userId}` === `${item.userId}`;
                        }

                        // Use name compare as a fallback
                        return (p.name ?? p.displayName) === item.name;
                    });

                    if (participant) {
                        result.push({
                            participant,
                            room: targetRoom
                        });
                    }
                });

                return result;
            }, []).map(({ room, participant }) => {
                logger.debug(`[GTS-PBR] send [${participant.name ?? participant.displayName}] To Room-{${room.name}}`, { participant, room });

                return dispatch(sendParticipantToRoom(participant.id, room.id));
            })
        );

        // 5、Remove rooms that are not in the preset data
        const presetSubRoomNameList = filter(meetingData, room => !room.isMainRoom).map(room => room.name as string);
        const toCleanSubRooms = filter(getBreakoutRooms(getState), room => !room.isMainRoom).filter(room => !presetSubRoomNameList.includes(room.name));

        await Promise.all(map(toCleanSubRooms, room => dispatch(removeBreakoutRoom(room.jid))));

        logger.debug('[GTS-PBR] removeBreakoutRoom completed：', toCleanSubRooms.map(room => room.name));
    };
}

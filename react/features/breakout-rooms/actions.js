// @flow

import _ from 'lodash';
import type { Dispatch } from 'redux';
import uuid from 'uuid';

import { openConnection } from '../../../connection';
import { getCurrentConference, setRoom } from '../base/conference';
import { connect, disconnect } from '../base/connection';
import { i18next } from '../base/i18n';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import {
    getLocalParticipant,
    getParticipantCount,
    getParticipants,
    isLocalParticipantModerator,
    PARTICIPANT_ROLE
} from '../base/participants';
import { createDesiredLocalTracks } from '../base/tracks';
import { getConferenceOptions } from '../conference/functions';
import { clearNotifications } from '../notifications';

import {
    ADD_ROOM,
    ADD_PROXY_MODERATOR_CONFERENCE,
    NOTIFY_ROOM_REMOVAL,
    REMOVE_PROXY_MODERATOR_CONFERENCE,
    REMOVE_ROOM,
    SET_IS_SCHEDULED_SEND_ROOMS_TO_ALL,
    SET_NEXT_ROOM_INDEX,
    UPDATE_PARTICIPANTS
} from './actionTypes';
import {
    JSON_TYPE_MOVE_TO_ROOM_REQUEST,
    JSON_TYPE_ROOMS,
    JSON_TYPE_ROOMS_REQUEST,
    SEND_ROOMS_TO_ALL_INTERVAL
} from './constants';
import {
    getBreakoutRooms,
    getMainRoomId,
    getProxyModeratorConference,
    getRoomById,
    getRooms
} from './functions';
import logger from './logger';

declare var APP: Object;

/**
 * Action to create a new breakout room. Also adds the main room on first run.
 *
 * @returns {Function}
 */
export function createBreakoutRoom() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const mainRoomId = getMainRoomId(getState);

        if (!getProxyModeratorConference(getState, mainRoomId)) {
            const mainRoom = {
                id: mainRoomId,
                isMainRoom: true
            };

            dispatch(_addRoom(mainRoom));
        }
        const { nextRoomIndex: index = 1 } = getBreakoutRooms(getState);
        const breakoutRoom = {
            id: uuid.v4(),
            name: i18next.t('breakoutRooms.name', { index }),
            index
        };

        dispatch({
            type: SET_NEXT_ROOM_INDEX,
            nextRoomIndex: index + 1
        });
        dispatch(_addRoom(breakoutRoom));
    };
}

/**
 * Action to add a room.
 *
 * @param {Object} room - The room object to add.
 * @returns {Function}
 */
function _addRoom(room: Object) {
    return (dispatch: Dispatch<any>) => {
        dispatch(_initRoom(room))
        .then(proxyModeratorConference => {
            const proxyModeratorId = proxyModeratorConference ? proxyModeratorConference.myUserId() : undefined;
            const { proxyModerators = [] } = room;
            const newProxyModerators = proxyModeratorId && !proxyModerators.includes(proxyModeratorId)
                ? [ ...proxyModerators, proxyModeratorId ]
                : proxyModerators;

            dispatch({
                type: ADD_ROOM,
                room: {
                    ...room,
                    proxyModerators: newProxyModerators
                }
            });
        });
    };
}

/**
 * Action to initialize a breakout room by moderators joining with the proxy moderator user.
 * This allows other participants to join breakout rooms without waiting for a host
 * and prevents them from becoming moderators.
 * The proxy moderator will grant owner permission to the moderator when joining a room.
 *
 * @param {Object} room - The id of the breakout room to initialize.
 * @returns {Promise<Object>} Promise returning the proxy moderator conference.
 */
function _initRoom(room) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { id: roomId } = room;

        if (!isLocalParticipantModerator(getState)) {
            return;
        }
        let proxyModeratorConference = getProxyModeratorConference(getState, roomId);

        if (proxyModeratorConference) {
            return proxyModeratorConference;
        }
        const proxyModeratorConnection = await openConnection({
            retry: false,
            roomName: roomId
        });

        proxyModeratorConference = proxyModeratorConnection.initJitsiConference(
            roomId,
            getConferenceOptions(getState)
        );
        dispatch({
            type: ADD_PROXY_MODERATOR_CONFERENCE,
            roomId,
            proxyModeratorConference
        });
        dispatch(_setupProxyModeratorConferenceListeners(proxyModeratorConference));
        await proxyModeratorConference.join();

        return proxyModeratorConference;
    };
}

/**
 * Action to setup listeners on a proxy moderator conference.
 *
 * @param {Object} proxyModeratorConference - A JitsiConference object.
 * @returns {Function}
 */
function _setupProxyModeratorConferenceListeners(proxyModeratorConference: Object) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        proxyModeratorConference.on(JitsiConferenceEvents.USER_ROLE_CHANGED, id => {
            if (id === proxyModeratorConference.myUserId() && proxyModeratorConference.isModerator()) {
                const roomId = proxyModeratorConference.options.name;
                const roomName = getRoomById(getState, roomId)?.name;

                dispatch(_sendRooms(proxyModeratorConference));
                if (roomName) {
                    proxyModeratorConference.setSubject(roomName);
                }
            }
        });

        proxyModeratorConference.on(JitsiConferenceEvents.DATA_CHANNEL_OPENED, () =>
            dispatch(_sendRooms(proxyModeratorConference)));

        proxyModeratorConference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, (participant, payload) => {
            if (payload?.type === JSON_TYPE_ROOMS_REQUEST) {
                dispatch(_sendRooms(proxyModeratorConference, participant.id));
            }
        });

        proxyModeratorConference.on(JitsiConferenceEvents.USER_JOINED, id => {
            const roomId = proxyModeratorConference.options.name;
            const { proxyModerators } = getRoomById(getState, roomId);
            const { id: localParticipantId } = getLocalParticipant(getState);

            if (id === localParticipantId || proxyModerators.includes(id)) {
                proxyModeratorConference.grantOwner(id);
            }
            dispatch(_updateParticipants(proxyModeratorConference));
        });

        proxyModeratorConference.on(JitsiConferenceEvents.USER_LEFT, () => {
            dispatch(_updateParticipants(proxyModeratorConference));
        });
    };
}

/**
 * Action to send a request for a list of rooms.
 *
 * @returns {Function}
 */
export function sendRoomsRequest() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        if (getParticipantCount(getState) > 1) {
            try {
                getCurrentConference(getState).sendEndpointMessage('', {
                    type: JSON_TYPE_ROOMS_REQUEST
                });
            } catch (e) {
                logger.error(e);
            }
        }
    };
}

/**
 * Sends the list of rooms and proxy moderators to the participants in all rooms.
 *
 * @returns {Function}
 */
export function sendRoomsToAll() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { proxyModeratorConferences = {}, isScheduledSendRoomsToAll = false } = getBreakoutRooms(getState);

        if (!_.isEmpty(proxyModeratorConferences) && !isScheduledSendRoomsToAll) {
            // Only send each SEND_ROOMS_TO_ALL_INTERVAL milliseconds
            // to prevent flooding of messages.
            dispatch({
                type: SET_IS_SCHEDULED_SEND_ROOMS_TO_ALL,
                isScheduledSendRoomsToAll: true
            });
            setTimeout(
                () => {
                    // eslint-disable-next-line no-shadow
                    const { proxyModeratorConferences: proxyModeratorConferences = {} } = getBreakoutRooms(getState);

                    dispatch({
                        type: SET_IS_SCHEDULED_SEND_ROOMS_TO_ALL,
                        isScheduledSendRoomsToAll: false
                    });
                    _.forEach(proxyModeratorConferences, conference => dispatch(_sendRooms(conference, '')));
                },
                SEND_ROOMS_TO_ALL_INTERVAL
            );
        }
    };
}

/**
 * Action to send the list of rooms to other participants in a conference.
 * If no participant id is provided they are send to all participants.
 *
 * @param {Object} proxyModeratorConference - The conference.
 * @param {string} participantId - The participant id.
 * @returns {Function}
 */
function _sendRooms(proxyModeratorConference, participantId = '') {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { rooms, removedRooms, nextRoomIndex } = getBreakoutRooms(getState);

        if (proxyModeratorConference.getParticipants().length > 1) {
            try {
                const message = {
                    type: JSON_TYPE_ROOMS,
                    rooms,
                    removedRooms,
                    nextRoomIndex
                };

                proxyModeratorConference.sendEndpointMessage(participantId, message);
            } catch (e) {
                logger.error(e);
            }
        }
    };
}

/**
 * Action to update the rooms.
 *
 * @param {{
 *      rooms: Object,
 *      removedRooms: Array<string>,
 *      nextRoomIndex: int
 * }} roomsUpdate - The received room state update.
 * @returns {void}
 */
export function updateRooms(roomsUpdate: {
        rooms: Object,
        removedRooms: Array<string>,
        nextRoomIndex: Number
        }
) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { rooms = {}, removedRooms = [], nextRoomIndex } = roomsUpdate;

        dispatch({
            type: SET_NEXT_ROOM_INDEX,
            nextRoomIndex
        });
        removedRooms.forEach(id => dispatch(removeRoom(id)));
        Object.values(rooms).forEach((room: Object) => {
            dispatch(_addRoom(room));

            // Grant owner to remote proxy moderators.
            const proxyModeratorConference = getProxyModeratorConference(getState, room.id);

            if (proxyModeratorConference && proxyModeratorConference.isModerator()) {
                const localProxyModeratorId = proxyModeratorConference.myUserId();

                (room.proxyModerators || []).forEach(id => {
                    if (id !== localProxyModeratorId) {
                        proxyModeratorConference.grantOwner(id);
                    }
                });
            }
        });
    };
}

/**
 * Grants owner permission to the local proxy moderator by the local moderator.
 *
 * @param {Object} participant - The participant to receive owner permission.
 * @returns {Function}
 */
export function grantOwnerToLocalProxyModerator(participant: Object) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const mainRoomId = getMainRoomId(getState);
        const proxyModeratorConference = getProxyModeratorConference(getState, mainRoomId);

        if (proxyModeratorConference) {
            const proxyModeratorId = proxyModeratorConference.myUserId();

            if (proxyModeratorId
                && proxyModeratorId === participant.id
                && participant.role !== PARTICIPANT_ROLE.MODERATOR) {
                // Local proxy moderator joined the room of the local moderator participant
                getCurrentConference(getState).grantOwner(proxyModeratorId);
            }
        }
    };
}

/**
 * Action to update the list of participants of a conference.
 *
 * @param {Object} proxyModeratorConference - The conference to update.
 * @returns {Function}
 */
function _updateParticipants(proxyModeratorConference: Object) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const roomId = proxyModeratorConference.options.name;
        const { proxyModerators } = getRoomById(getState, roomId);
        const participants = proxyModeratorConference.getParticipants()
            .filter(participant => !proxyModerators.includes(participant._id))
            .map(participant => {
                const { _id, _role, _displayName } = participant;

                return {
                    id: _id,
                    role: _role,
                    displayName: _displayName
                };
            });

        dispatch({
            type: UPDATE_PARTICIPANTS,
            roomId,
            participants
        });
    };
}

/**
 * Action to auto-assign the participants to breakout rooms.
 *
 * @returns {Function}
 */
export function autoAssignToBreakoutRooms() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const breakoutRooms = _.filter(getRooms(getState), (room: Object) => !room.isMainRoom);
        const participants = getParticipants(getState).filter(p => !p.local);
        const length = participants.length / breakoutRooms.length;

        _.chunk(_.shuffle([ ...participants ]), length).forEach((group, index) =>
            group.forEach(participant =>
                dispatch(sendParticipantToRoom(participant.id, breakoutRooms[index].id))
            )
        );
    };
}

/**
 * Action to send a participant to a room.
 *
 * @param {string} participantId - The participant id.
 * @param {string} roomId - The room id.
 * @returns {Function}
 */
export function sendParticipantToRoom(participantId: string, roomId: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        try {
            const message = {
                type: JSON_TYPE_MOVE_TO_ROOM_REQUEST,
                roomId
            };

            getCurrentConference(getState).sendEndpointMessage(participantId, message);
        } catch (e) {
            logger.error(e);
        }
    };
}

/**
 * Action to move to a room.
 *
 * @param {string} roomId - The room id to move to. If omitted the move will be to the main room.
 * @returns {Function}
 */
export function moveToRoom(roomId?: string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const mainRoomId = getMainRoomId(getState);
        const _roomId = roomId || mainRoomId;

        if (navigator.product === 'ReactNative') {
            dispatch(disconnect());
            dispatch(clearNotifications());
            dispatch(setRoom(_roomId));
            dispatch(createDesiredLocalTracks());
            dispatch(connect());
        } else {
            const conference = APP.conference;

            conference.leaveRoomAndDisconnect()
                .then(() => {
                    dispatch(setRoom(_roomId));
                });
            conference.roomName = _roomId;
            conference.createInitialLocalTracksAndConnect(_roomId)
                .then(([ tracks, con ]) => conference.startConference(con, tracks));
        }
    };
}

/**
 * Action to remove a room and add it to the list to inform other participants.
 *
 * @param {string} roomId - The id of the room to remove.
 * @returns {Function}
 */
export function removeRoom(roomId: string) {
    return (dispatch: Dispatch<any>) => {
        dispatch(_removeRoom(roomId))
            .then(dispatch({
                type: NOTIFY_ROOM_REMOVAL,
                roomId
            }));
    };
}

/**
 * Action to remove a room.
 *
 * @param {string} roomId - The id of the room to remove.
 * @returns {Function}
 */
function _removeRoom(roomId: string) {
    return (dispatch: Dispatch<any>) => {
        _hangupProxyModeratorConference(roomId);
        dispatch({
            type: REMOVE_ROOM,
            roomId
        });
    };
}

/**
 * Action to hangup all proxy moderator conferences.
 *
 * @returns {Function}
 */
export function hangupAllProxyModeratorConferences() {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const { proxyModeratorConferences = {} } = getBreakoutRooms(getState);

        Object.keys(proxyModeratorConferences).forEach(roomId =>
            _hangupProxyModeratorConference(roomId));
    };
}

/**
 * Action to hangup a proxy moderator conference.
 *
 * @param {string} roomId - The id of the conference to hang up.
 * @returns {Function}
 */
function _hangupProxyModeratorConference(roomId: string) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const proxyModeratorConference = getProxyModeratorConference(getState, roomId);

        if (proxyModeratorConference) {
            const proxyModeratorId = proxyModeratorConference.myUserId();
            const proxyModeratorConnection = proxyModeratorConference.connection;

            proxyModeratorConference.leave();
            proxyModeratorConnection.disconnect();
            dispatch({
                type: REMOVE_PROXY_MODERATOR_CONFERENCE,
                roomId,
                proxyModeratorId
            });
        }
    };
}

// @flow

import _ from 'lodash';

import { getCurrentConference } from '../base/conference';
import { getParticipantById, getParticipantCount, isLocalParticipantModerator } from '../base/participants';
import { toState } from '../base/redux';

import { FEATURE_KEY } from './constants';

/**
 * Returns the rooms object for breakout rooms.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object} Object of rooms.
 */
export const getBreakoutRooms = (stateful: Function | Object) => toState(stateful)[FEATURE_KEY].rooms;

/**
 * Returns the main room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object|undefined} The main room object, or undefined.
 */
export const getMainRoom = (stateful: Function | Object) => {
    const rooms = getBreakoutRooms(stateful);

    return _.find(rooms, (room: Object) => room.isMainRoom);
};

export const getRoomsInfo = (stateful: Function | Object) => {
    const breakoutRooms = getBreakoutRooms(stateful);
    const conference = getCurrentConference(stateful);

    const initialRoomsInfo = {
        rooms: []
    };

    // only main roomn
    if (!breakoutRooms || Object.keys(breakoutRooms).length === 0) {
        return {
            ...initialRoomsInfo,
            rooms: [ {
                isMainRoom: true,
                id: conference?.room?.roomjid,
                jid: conference?.room?.myroomjid,
                participants: conference && conference.participants && Object.keys(conference.participants).length
                    ? Object.keys(conference.participants).map(participantId => {
                        const participantItem = conference?.participants[participantId];
                        const storeParticipant = getParticipantById(stateful, participantItem._id);

                        return {
                            jid: participantItem._jid,
                            role: participantItem._role,
                            displayName: participantItem._displayName,
                            avatarUrl: storeParticipant?.loadableAvatarUrl,
                            id: participantItem._id
                        };
                    }) : []
            } ]
        };
    }

    return {
        ...initialRoomsInfo,
        rooms: Object.keys(breakoutRooms).map(breakoutRoomKey => {
            const breakoutRoomItem = breakoutRooms[breakoutRoomKey];

            return {
                isMainRoom: Boolean(breakoutRoomItem.isMainRoom),
                id: breakoutRoomItem.id,
                jid: breakoutRoomItem.jid,
                participants: breakoutRoomItem.participants && Object.keys(breakoutRoomItem.participants).length
                    ? Object.keys(breakoutRoomItem.participants).map(participantLongId => {
                        const participantItem = breakoutRoomItem.participants[participantLongId];
                        const ids = participantLongId.split('/');
                        const storeParticipant = getParticipantById(stateful,
                            ids.length > 1 ? ids[1] : participantItem.jid);

                        return {
                            jid: participantItem?.jid,
                            role: participantItem?.role,
                            displayName: participantItem?.displayName,
                            avatarUrl: storeParticipant?.loadableAvatarUrl,
                            id: storeParticipant ? storeParticipant.id
                                : participantLongId
                        };
                    }) : []
            };
        })
    };
};

/**
 * Returns the room by Jid.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @param {string} roomJid - The jid of the room.
 * @returns {Object|undefined} The main room object, or undefined.
 */
export const getRoomByJid = (stateful: Function | Object, roomJid: string): Object => {
    const rooms = getBreakoutRooms(stateful);

    return _.find(rooms, (room: Object) => room.jid === roomJid);
};

/**
 * Returns the id of the current room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {string} Room id or undefined.
 */
export const getCurrentRoomId = (stateful: Function | Object) => {
    const conference = getCurrentConference(stateful);

    // $FlowExpectedError
    return conference?.getName();
};

/**
 * Determines whether the local participant is in a breakout room.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {boolean}
 */
export const isInBreakoutRoom = (stateful: Function | Object) => {
    const conference = getCurrentConference(stateful);

    // $FlowExpectedError
    return conference?.getBreakoutRooms()
        ?.isBreakoutRoom();
};

/**
 * Returns the breakout rooms config.
 *
 * @param {Function|Object} stateful - The redux store, the redux
 * {@code getState} function, or the redux state itself.
 * @returns {Object}
 */
export const getBreakoutRoomsConfig = (stateful: Function | Object) => {
    const state = toState(stateful);
    const { breakoutRooms = {} } = state['features/base/config'];

    return breakoutRooms;
};

/**
 * Returns whether the add breakout room button is visible.
 *
 * @param {Function | Object} stateful - Global state.
 * @returns {boolean}
 */
export const isAddBreakoutRoomButtonVisible = (stateful: Function | Object) => {
    const state = toState(stateful);
    const isLocalModerator = isLocalParticipantModerator(state);
    const { conference } = state['features/base/conference'];
    const isBreakoutRoomsSupported = conference?.getBreakoutRooms()?.isSupported();
    const { hideAddRoomButton } = getBreakoutRoomsConfig(state);

    return isLocalModerator && isBreakoutRoomsSupported && !hideAddRoomButton;
};

/**
 * Returns whether the auto assign participants to breakout rooms button is visible.
 *
 * @param {Function | Object} stateful - Global state.
 * @returns {boolean}
 */
export const isAutoAssignParticipantsVisible = (stateful: Function | Object) => {
    const state = toState(stateful);
    const rooms = getBreakoutRooms(state);
    const inBreakoutRoom = isInBreakoutRoom(state);
    const isLocalModerator = isLocalParticipantModerator(state);
    const participantsCount = getParticipantCount(state);
    const { hideAutoAssignButton } = getBreakoutRoomsConfig(state);

    return !inBreakoutRoom
        && isLocalModerator
        && participantsCount > 2
        && Object.keys(rooms).length > 1
        && !hideAutoAssignButton;
};

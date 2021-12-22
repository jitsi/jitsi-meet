// @flow

import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getParticipantById } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { editMessage, MESSAGE_TYPE_REMOTE } from '../chat';

import { UPDATE_BREAKOUT_ROOMS } from './actionTypes';
import { moveToRoom } from './actions';
import { getBreakoutRooms } from './functions';
import logger from './logger';

/**
 * Registers a change handler for state['features/base/conference'].conference to
 * set the event listeners needed for the breakout rooms feature to operate.
 */
StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch }, previousConference) => {
        if (conference && !previousConference) {
            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_MOVE_TO_ROOM, roomId => {
                logger.debug(`Moving to room: ${roomId}`);
                dispatch(moveToRoom(roomId));
            });

            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_UPDATED, ({ rooms, roomCounter }) => {
                logger.debug('Room list updated');
                dispatch({
                    type: UPDATE_BREAKOUT_ROOMS,
                    rooms,
                    roomCounter
                });
            });
        }
    });

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const { type } = action;
    const result = next(action);

    switch (type) {
    case UPDATE_BREAKOUT_ROOMS: {
        const { messages } = getState()['features/chat'];

        // edit the chat history to match names for participants in breakout rooms
        messages && messages.forEach(m => {
            if (m.messageType === MESSAGE_TYPE_REMOTE && !getParticipantById(getState(), m.id)) {
                const rooms = getBreakoutRooms(getState);

                for (const room of Object.values(rooms)) {
                    // $FlowExpectedError
                    const participants = room.participants || {};
                    const matchedJid = Object.keys(participants).find(jid => jid.endsWith(m.id));

                    if (matchedJid) {
                        m.displayName = participants[matchedJid].displayName;

                        dispatch(editMessage(m));
                    }
                }
            }
        });

        break;
    }
    }

    return result;
});

import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getParticipantById } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { editMessage } from '../chat/actions.any';
import { MESSAGE_TYPE_REMOTE } from '../chat/constants';

import { UPDATE_BREAKOUT_ROOMS } from './actionTypes';
import { moveToRoom } from './actions';
import logger from './logger';
import { IRooms } from './types';
import { Participants } from './utils';

/**
 * Registers a change handler for state['features/base/conference'].conference to
 * set the event listeners needed for the breakout rooms feature to operate.
 */
StateListenerRegistry.register(
    state => state['features/base/conference'].conference,
    (conference, { dispatch }, previousConference) => {
        if (conference && !previousConference) {
            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_MOVE_TO_ROOM, (roomId: string) => {
                logger.debug(`Moving to room: ${roomId}`);
                dispatch(moveToRoom(roomId));
            });

            conference.on(JitsiConferenceEvents.BREAKOUT_ROOMS_UPDATED, ({ rooms, roomCounter }: {
                roomCounter: number; rooms: IRooms;
            }) => {
                logger.debug('Room list updated');
                if (typeof APP !== 'undefined') {
                    APP.API.notifyBreakoutRoomsUpdated(rooms);
                }
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

    switch (type) {
    case UPDATE_BREAKOUT_ROOMS: {
        // edit name if it was overwritten
        if (!action.updatedNames) {
            const { overwrittenNameList } = getState()['features/base/participants'];

            if (Object.keys(overwrittenNameList).length > 0) {
                const newRooms: IRooms = {};

                Object.entries(action.rooms as IRooms).forEach(([ key, r ]) => {
                    let participants = r?.participants || new Map();
                    let jid;

                    for (const id of Object.keys(overwrittenNameList)) {
                        jid = Participants.findById(r, id)?.jid;

                        if (jid) {
                            const participant = participants.get(jid);
                            if (participant) {
                                participants.set(jid, {
                                    ...participant,
                                    displayName: overwrittenNameList[id as keyof typeof overwrittenNameList]
                                });
                            }
                        }
                    }

                    newRooms[key] = {
                        ...r,
                        participants
                    };
                });

                action.rooms = newRooms;
            }
        }

        // edit the chat history to match names for participants in breakout rooms
        const { messages } = getState()['features/chat'];

        messages?.forEach(m => {
            if (m.messageType === MESSAGE_TYPE_REMOTE && !getParticipantById(getState(), m.participantId)) {
                const rooms: IRooms = action.rooms;

                for (const room of Object.values(rooms)) {
                    const participant = Participants.findByPartialJid(room, m.participantId);

                    if (participant) {
                        m.displayName = participant.displayName;

                        dispatch(editMessage(m));
                    }
                }
            }
        });

        break;
    }
    }

    return next(action);
});

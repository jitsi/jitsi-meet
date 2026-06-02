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
        // Enrich participants with userContext from Redux store
        if (!action.updatedNames) {
            const state = getState();
            const { overwrittenNameList, local: localParticipant } = state['features/base/participants'];
            const jwtUser = state['features/base/jwt']?.user;
            const localUserContext = jwtUser ? {
                id: jwtUser.id,
                name: jwtUser.name
            } : {
                id: localParticipant?.jwtId,
                name: localParticipant?.name
            };

            // Get existing userContext cache
            const existingCache = state['features/breakout-rooms'].userContextCache || {};
            const newCache = { ...existingCache };

            const newRooms: IRooms = {};

            Object.entries(action.rooms as IRooms).forEach(([ key, r ]) => {
                let participants = r?.participants || {};

                // Add userContext to each participant
                const enhancedParticipants: typeof participants = {};

                for (const [ participantJid, participantData ] of Object.entries(participants)) {
                    const ids = participantJid.split('/');
                    const participantId = ids.length > 1 ? ids[1] : participantData.jid;
                    const storeParticipant = getParticipantById(state, participantId);
                    const isLocal = storeParticipant?.id === localParticipant?.id;

                    // Try to get userContext from: local, store, cache, or incoming data
                    const userContext = isLocal
                        ? localUserContext
                        : (storeParticipant?.userContext || newCache[participantId] || participantData.userContext);

                    // Update cache if we have userContext
                    if (userContext && participantId) {
                        newCache[participantId] = userContext;
                    }

                    enhancedParticipants[participantJid] = {
                        ...participantData,
                        userContext
                    };
                }

                participants = enhancedParticipants;

                // Apply overwritten display names
                if (Object.keys(overwrittenNameList).length > 0) {
                    for (const id of Object.keys(overwrittenNameList)) {
                        const jid = Object.keys(participants).find(p => p.slice(p.indexOf('/') + 1) === id);

                        if (jid) {
                            participants = {
                                ...participants,
                                [jid]: {
                                    ...participants[jid],
                                    displayName: overwrittenNameList[id as keyof typeof overwrittenNameList]
                                }
                            };
                        }
                    }
                }

                newRooms[key] = {
                    ...r,
                    participants
                };
            });

            action.rooms = newRooms;
            action.userContextCache = newCache;
        }

        // edit the chat history to match names for participants in breakout rooms
        const { messages } = getState()['features/chat'];

        messages?.forEach(m => {
            if (m.messageType === MESSAGE_TYPE_REMOTE && !getParticipantById(getState(), m.participantId)) {
                const rooms: IRooms = action.rooms;

                for (const room of Object.values(rooms)) {
                    const participants = room.participants || {};
                    const matchedJid = Object.keys(participants).find(jid => jid.endsWith(m.participantId));

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

    return next(action);
});

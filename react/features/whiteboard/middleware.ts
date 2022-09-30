/* eslint-disable import/order */
import { generateCollaborationLinkData } from '@jitsi/excalidraw';
import { IStore } from '../app/types';

import { participantJoined, participantLeft, pinParticipant } from '../base/participants/actions';

// @ts-ignore
import { getCurrentConference } from '../base/conference/functions';

// @ts-ignore
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { RESET_WHITEBOARD, SET_WHITEBOARD_OPEN } from './actionTypes';
import { getCollabDetails, getCollabServerUrl, isWhiteboardPresent } from './functions';
import { WHITEBOARD_ID, WHITEBOARD_PARTICIPANT_NAME } from './constants';
import { resetWhiteboard, setWhiteboardOpen, setupWhiteboard } from './actions';
import { getCurrentRoomId } from '../breakout-rooms/functions';

// @ts-ignore
import { addStageParticipant } from '../filmstrip/actions.web';

// @ts-ignore
import { isStageFilmstripAvailable } from '../filmstrip/functions';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';

const focusWhiteboard = (store: IStore) => {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);
    const stageFilmstrip = isStageFilmstripAvailable(state);
    const isPresent = isWhiteboardPresent(state);

    if (!isPresent) {
        dispatch(participantJoined({
            conference,
            id: WHITEBOARD_ID,
            isFakeParticipant: true,
            isWhiteboard: true,
            name: WHITEBOARD_PARTICIPANT_NAME
        }));
    }
    if (stageFilmstrip) {
        dispatch(addStageParticipant(WHITEBOARD_ID, true));
    } else {
        dispatch(pinParticipant(WHITEBOARD_ID));
    }
};

/**
 * Middleware which intercepts whiteboard actions to handle changes to the related state.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => async (action: any) => {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);

    switch (action.type) {
    case SET_WHITEBOARD_OPEN: {
        const existingCollabDetails = getCollabDetails(state);

        if (!existingCollabDetails) {
            const collabDetails = await generateCollaborationLinkData();
            const collabServerUrl = getCollabServerUrl(state);

            focusWhiteboard(store);
            dispatch(setupWhiteboard({
                collabDetails: {
                    roomId: getCurrentRoomId(state),
                    roomKey: collabDetails.roomKey
                }
            }));
            conference.getMetadataHandler().setMetadata(WHITEBOARD_ID, {
                collabServerUrl,
                roomKey: collabDetails.roomKey
            });

            return;
        }

        if (action.isOpen) {
            focusWhiteboard(store);

            return;
        }

        dispatch(participantLeft(WHITEBOARD_ID, conference, { isWhiteboard: true }));
        break;
    }
    case RESET_WHITEBOARD: {
        dispatch(participantLeft(WHITEBOARD_ID, conference, { isWhiteboard: true }));
        break;
    }
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. Disable the whiteboard if it's left open.
 */
StateListenerRegistry.register(

    // @ts-ignore
    state => getCurrentConference(state),

    // @ts-ignore
    (conference, { dispatch, getState }, previousConference): void => {
        if (conference !== previousConference) {
            dispatch(resetWhiteboard());
        }
        if (conference && !previousConference) {
            conference.on(JitsiConferenceEvents.METADATA_UPDATED, (metadata: any) => {
                if (metadata[WHITEBOARD_ID]) {
                    dispatch(setupWhiteboard({
                        collabDetails: {
                            roomId: getCurrentRoomId(getState()),
                            roomKey: metadata[WHITEBOARD_ID].roomKey
                        }
                    }));
                    dispatch(setWhiteboardOpen(true));
                }
            });
        }
    });

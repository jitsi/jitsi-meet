import { generateCollaborationLinkData } from '@jitsi/excalidraw';

import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { participantJoined, participantLeft, pinParticipant } from '../base/participants/actions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { getCurrentRoomId } from '../breakout-rooms/functions';
import { addStageParticipant } from '../filmstrip/actions.web';
import { isStageFilmstripAvailable } from '../filmstrip/functions';

import { RESET_WHITEBOARD, SET_WHITEBOARD_OPEN } from './actionTypes';
import { resetWhiteboard, setWhiteboardOpen, setupWhiteboard } from './actions';
import { WHITEBOARD_ID, WHITEBOARD_PARTICIPANT_NAME } from './constants';
import { getCollabDetails, getCollabServerUrl, isWhiteboardPresent } from './functions';

const focusWhiteboard = (store: IStore) => {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);
    const stageFilmstrip = isStageFilmstripAvailable(state);
    const isPresent = isWhiteboardPresent(state);

    if (!isPresent) {
        dispatch(participantJoined({
            conference,
            fakeParticipant: FakeParticipant.Whiteboard,
            id: WHITEBOARD_ID,
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
            const collabLinkData = await generateCollaborationLinkData();
            const collabServerUrl = getCollabServerUrl(state);
            const roomId = getCurrentRoomId(state);
            const collabDetails = {
                roomId,
                roomKey: collabLinkData.roomKey
            };

            focusWhiteboard(store);
            dispatch(setupWhiteboard({ collabDetails }));
            conference.getMetadataHandler().setMetadata(WHITEBOARD_ID, {
                collabServerUrl,
                collabDetails
            });

            return;
        }

        if (action.isOpen) {
            focusWhiteboard(store);

            return;
        }

        dispatch(participantLeft(WHITEBOARD_ID, conference, { fakeParticipant: FakeParticipant.Whiteboard }));
        break;
    }
    case RESET_WHITEBOARD: {
        dispatch(participantLeft(WHITEBOARD_ID, conference, { fakeParticipant: FakeParticipant.Whiteboard }));
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
    (conference, { dispatch }, previousConference): void => {
        if (conference !== previousConference) {
            dispatch(resetWhiteboard());
        }
        if (conference && !previousConference) {
            conference.on(JitsiConferenceEvents.METADATA_UPDATED, (metadata: any) => {
                if (metadata[WHITEBOARD_ID]) {
                    dispatch(setupWhiteboard({
                        collabDetails: metadata[WHITEBOARD_ID].collabDetails
                    }));
                    dispatch(setWhiteboardOpen(true));
                }
            });
        }
    });

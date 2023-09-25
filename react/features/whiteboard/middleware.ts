import { generateCollaborationLinkData } from '@jitsi/excalidraw';
import { AnyAction } from 'redux';

import { createOpenWhiteboardEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { hideDialog, openDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { participantJoined, participantLeft, pinParticipant } from '../base/participants/actions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { getCurrentRoomId } from '../breakout-rooms/functions';
import { addStageParticipant } from '../filmstrip/actions.web';
import { isStageFilmstripAvailable } from '../filmstrip/functions.web';

import { RESET_WHITEBOARD, SET_WHITEBOARD_OPEN } from './actionTypes';
import {
    notifyWhiteboardLimit,
    resetWhiteboard,
    restrictWhiteboard,
    setWhiteboardOpen,
    setupWhiteboard
} from './actions';
import WhiteboardLimitDialog from './components/web/WhiteboardLimitDialog';
import { WHITEBOARD_ID, WHITEBOARD_PARTICIPANT_NAME } from './constants';
import {
    getCollabDetails,
    getCollabServerUrl,
    isWhiteboardOpen,
    isWhiteboardPresent,
    shouldEnforceUserLimit,
    shouldNotifyUserLimit
} from './functions';
import { WhiteboardStatus } from './types';

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
MiddlewareRegistry.register((store: IStore) => (next: Function) => async (action: AnyAction) => {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);

    switch (action.type) {
    case SET_WHITEBOARD_OPEN: {
        const existingCollabDetails = getCollabDetails(state);
        const enforceUserLimit = shouldEnforceUserLimit(state);
        const notifyUserLimit = shouldNotifyUserLimit(state);

        if (enforceUserLimit) {
            dispatch(restrictWhiteboard(false));
            dispatch(openDialog(WhiteboardLimitDialog));

            return;
        }

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
            conference?.getMetadataHandler().setMetadata(WHITEBOARD_ID, {
                collabServerUrl,
                collabDetails
            });
            raiseWhiteboardNotification(WhiteboardStatus.INSTANTIATED);

            return;
        }

        if (action.isOpen) {
            if (enforceUserLimit) {
                dispatch(restrictWhiteboard());

                return;
            }

            if (notifyUserLimit) {
                dispatch(notifyWhiteboardLimit());
            }

            if (isDialogOpen(state, WhiteboardLimitDialog)) {
                dispatch(hideDialog(WhiteboardLimitDialog));
            }

            focusWhiteboard(store);
            sendAnalytics(createOpenWhiteboardEvent());
            raiseWhiteboardNotification(WhiteboardStatus.SHOWN);

            return;
        }

        dispatch(participantLeft(WHITEBOARD_ID, conference, { fakeParticipant: FakeParticipant.Whiteboard }));
        raiseWhiteboardNotification(WhiteboardStatus.HIDDEN);

        break;
    }
    case RESET_WHITEBOARD: {
        dispatch(participantLeft(WHITEBOARD_ID, conference, { fakeParticipant: FakeParticipant.Whiteboard }));
        raiseWhiteboardNotification(WhiteboardStatus.RESET);

        break;
    }
    }

    return next(action);
});

/**
 * Raises the whiteboard status notifications changes (if API is enabled).
 *
 * @param {WhiteboardStatus} status - The whiteboard changed status.
 * @returns {Function}
 */
function raiseWhiteboardNotification(status: WhiteboardStatus) {
    if (typeof APP !== 'undefined') {
        APP.API.notifyWhiteboardStatusChanged(status);
    }
}

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. Disable the whiteboard if it's left open.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
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

/**
 * Set up state change listener to limit whiteboard access.
 */
StateListenerRegistry.register(
    state => shouldEnforceUserLimit(state),
    (enforceUserLimit, { dispatch, getState }): void => {
        if (isWhiteboardOpen(getState()) && enforceUserLimit) {
            dispatch(restrictWhiteboard());
        }
    }
);

/**
 * Set up state change listener to notify about whiteboard usage.
 */
StateListenerRegistry.register(
    state => shouldNotifyUserLimit(state),
    (notifyUserLimit, { dispatch, getState }, prevNotifyUserLimit): void => {
        if (isWhiteboardOpen(getState()) && notifyUserLimit && !prevNotifyUserLimit) {
            dispatch(notifyWhiteboardLimit());
        }
    }
);


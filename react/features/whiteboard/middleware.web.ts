import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { hideDialog, openDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import { participantJoined, participantLeft, pinParticipant } from '../base/participants/actions';
import { getParticipantCount } from '../base/participants/functions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { getCurrentRoomId } from '../breakout-rooms/functions';
import { addStageParticipant } from '../filmstrip/actions.web';
import { isStageFilmstripAvailable } from '../filmstrip/functions.web';
import { showErrorNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { RESET_WHITEBOARD, SET_WHITEBOARD_OPEN } from './actionTypes';
import {
    notifyWhiteboardLimit,
    restrictWhiteboard,
    setupWhiteboard
} from './actions';
import WhiteboardLimitDialog from './components/web/WhiteboardLimitDialog';
import { WHITEBOARD_ID, WHITEBOARD_PARTICIPANT_NAME } from './constants';
import {
    generateCollabServerUrl,
    getCollabDetails,
    getCollabServerUrl,
    isWhiteboardOpen,
    isWhiteboardPresent,
    shouldEnforceUserLimit,
    shouldNotifyUserLimit
} from './functions';
import logger from './logger';
import { WhiteboardStatus } from './types';

import './middleware.any';

/**
 * Flag to track whether the whiteboard was opened by the local participant.
 * Used to show the collaboration unavailable notification only to the
 * participant that initiated the whiteboard, not to others that join later.
 */
let _whiteboardOpenedLocally = false;

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
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const { dispatch, getState } = store;
    const state = getState();
    const conference = getCurrentConference(state);

    switch (action.type) {
    case SET_WHITEBOARD_OPEN: {
        const existingCollabDetails = getCollabDetails(state);
        const collabServerUrl = getCollabServerUrl(state);
        const enforceUserLimit = shouldEnforceUserLimit(state);
        const notifyUserLimit = shouldNotifyUserLimit(state);
        const iAmRecorder = Boolean(state['features/base/config'].iAmRecorder);

        if (enforceUserLimit) {
            dispatch(restrictWhiteboard(false));
            dispatch(openDialog('WhiteboardLimitDialog', WhiteboardLimitDialog));
            iAmRecorder && setTimeout(() => dispatch(hideDialog('WhiteboardLimitDialog', WhiteboardLimitDialog)), 3000);

            return next(action);
        }

        if (!existingCollabDetails) {
            if (action.isOpen) {
                setNewWhiteboardOpen(store);
            }

            return;
        }

        if (action.isOpen) {
            const participantCount = getParticipantCount(state);

            if (participantCount >= 2
                && (!existingCollabDetails.roomId || !existingCollabDetails.roomKey || !collabServerUrl)) {
                const missing = [
                    !existingCollabDetails.roomId && 'roomId',
                    !existingCollabDetails.roomKey && 'roomKey',
                    !collabServerUrl && 'collabServerUrl'
                ].filter(Boolean).join(', ');

                logger.error(`Whiteboard open failed, missing collaboration data: ${missing}`);

                return;
            }
            if (enforceUserLimit) {
                dispatch(restrictWhiteboard());

                return next(action);
            }

            if (notifyUserLimit) {
                dispatch(notifyWhiteboardLimit());
            }

            if (isDialogOpen(state, WhiteboardLimitDialog)) {
                dispatch(hideDialog('WhiteboardLimitDialog', WhiteboardLimitDialog));
            }

            focusWhiteboard(store);
            raiseWhiteboardNotification(WhiteboardStatus.SHOWN);

            return next(action);
        }

        _whiteboardOpenedLocally = false;
        dispatch(participantLeft(WHITEBOARD_ID, conference, { fakeParticipant: FakeParticipant.Whiteboard }));
        raiseWhiteboardNotification(WhiteboardStatus.HIDDEN);

        break;
    }
    case RESET_WHITEBOARD: {
        _whiteboardOpenedLocally = false;
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
 * Sets a new whiteboard open.
 *
 * @param {IStore} store - The redux store.
 * @returns {Promise}
 */
async function setNewWhiteboardOpen(store: IStore) {
    _whiteboardOpenedLocally = true;

    const { dispatch, getState } = store;
    const { generateCollaborationLinkData } = await import(/* webpackChunkName: "excalidraw" */ '@jitsi/excalidraw');
    const collabLinkData = await generateCollaborationLinkData();
    const state = getState();
    const conference = getCurrentConference(state);
    const collabServerUrl = generateCollabServerUrl(state);
    const roomId = getCurrentRoomId(state);
    const collabData = {
        collabDetails: {
            roomId,
            roomKey: collabLinkData.roomKey
        },
        collabServerUrl
    };

    dispatch(setupWhiteboard(collabData));
    conference?.getMetadataHandler().setMetadata(WHITEBOARD_ID, collabData);
    raiseWhiteboardNotification(WhiteboardStatus.INSTANTIATED);
}

/**
 * Notify when a participant joins while the whiteboard is open
 * and collaboration data is missing.
 */
StateListenerRegistry.register(
    state => getParticipantCount(state),
    (participantCount, { dispatch, getState }, prevParticipantCount): void => {
        if (participantCount >= 2
            && (prevParticipantCount ?? 0) < 2
            && _whiteboardOpenedLocally
            && isWhiteboardOpen(getState())) {
            const state = getState();
            const collabDetails = getCollabDetails(state);
            const collabServerUrl = getCollabServerUrl(state);

            if (!collabDetails?.roomId || !collabDetails?.roomKey || !collabServerUrl) {
                const missing = [
                    !collabDetails?.roomId && 'roomId',
                    !collabDetails?.roomKey && 'roomKey',
                    !collabServerUrl && 'collabServerUrl'
                ].filter(Boolean).join(', ');

                logger.error(`Whiteboard collaboration unavailable, missing data: ${missing}`);
                dispatch(showErrorNotification({
                    titleKey: 'info.noWhiteboardSharing'
                }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
            }
        }
    }
);

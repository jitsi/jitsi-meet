import { isEqual } from 'lodash-es';

import { createOpenWhiteboardEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { _RESET_BREAKOUT_ROOMS } from '../breakout-rooms/actionTypes';

import { SET_WHITEBOARD_OPEN } from './actionTypes';
import {
    notifyWhiteboardLimit,
    resetWhiteboard,
    restrictWhiteboard,
    setWhiteboardOpen,
    setupWhiteboard
} from './actions';
import { WHITEBOARD_ID } from './constants';
import {
    generateCollabServerUrl,
    getCollabDetails,
    isWhiteboardOpen,
    shouldEnforceUserLimit,
    shouldNotifyUserLimit
} from './functions';

let ignoreNextWhiteboardMetadataAutoOpen = false;

MiddlewareRegistry.register((store: IStore) => next => action => {
    const state = store.getState();

    switch (action.type) {
    case SET_WHITEBOARD_OPEN: {
        const enforceUserLimit = shouldEnforceUserLimit(state);
        const notifyUserLimit = shouldNotifyUserLimit(state);

        if (action.isOpen && !enforceUserLimit && !notifyUserLimit) {
            sendAnalytics(createOpenWhiteboardEvent());

            return next(action);
        }

        break;
    }

    case UPDATE_CONFERENCE_METADATA: {
        const { metadata } = action;

        if (metadata?.[WHITEBOARD_ID]) {
            const existingCollabDetails = getCollabDetails(state);
            const { collabDetails } = metadata[WHITEBOARD_ID];
            const hasNewCollabDetails = !isEqual(existingCollabDetails, collabDetails);

            store.dispatch(setupWhiteboard({
                collabDetails,
                collabServerUrl: generateCollabServerUrl(store.getState())
            }));

            if (hasNewCollabDetails && !ignoreNextWhiteboardMetadataAutoOpen) {
                store.dispatch(setWhiteboardOpen(true));
            }

            if (ignoreNextWhiteboardMetadataAutoOpen) {
                ignoreNextWhiteboardMetadataAutoOpen = false;
            }
        }

        break;
    }

    case _RESET_BREAKOUT_ROOMS:
        ignoreNextWhiteboardMetadataAutoOpen = true;
        store.dispatch(resetWhiteboard());
        break;
    }

    return next(action);
});

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

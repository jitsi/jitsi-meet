import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { hideDialog, openDialog } from '../base/dialog/actions';
import { isDialogOpen } from '../base/dialog/functions';
import { getLocalParticipant } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import {
    navigate
} from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';

import { SET_WHITEBOARD_OPEN } from './actionTypes';
import {
    notifyWhiteboardLimit,
    restrictWhiteboard
} from './actions';
import WhiteboardLimitDialog from './components/native/WhiteboardLimitDialog';
import {
    generateCollabServerUrl,
    getCollabDetails,
    shouldEnforceUserLimit,
    shouldNotifyUserLimit
} from './functions';
import './middleware.any';

/**
 * Middleware which intercepts whiteboard actions to handle changes to the related state.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const { dispatch, getState } = store;
    const state = getState();

    switch (action.type) {
    case SET_WHITEBOARD_OPEN: {
        const { isOpen } = action;

        const enforceUserLimit = shouldEnforceUserLimit(state);
        const notifyUserLimit = shouldNotifyUserLimit(state);

        if (enforceUserLimit) {
            dispatch(restrictWhiteboard(false));
            dispatch(openDialog(WhiteboardLimitDialog));

            return next(action);
        }

        if (isOpen) {
            if (enforceUserLimit) {
                dispatch(restrictWhiteboard());

                return next(action);
            }

            if (notifyUserLimit) {
                dispatch(notifyWhiteboardLimit());
            }

            if (isDialogOpen(state, WhiteboardLimitDialog)) {
                dispatch(hideDialog(WhiteboardLimitDialog));
            }

            const collabDetails = getCollabDetails(state);
            const collabServerUrl = generateCollabServerUrl(state);
            const localParticipantName = getLocalParticipant(state)?.name;

            navigate(screen.conference.whiteboard, {
                collabDetails,
                collabServerUrl,
                localParticipantName
            });

            return next(action);
        }

        break;
    }
    }

    return next(action);
});

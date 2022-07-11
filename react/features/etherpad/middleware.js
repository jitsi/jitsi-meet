// @flow

import UIEvents from '../../../service/UI/UIEvents';
import { getCurrentConference } from '../base/conference';
import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { TOGGLE_DOCUMENT_EDITING } from './actionTypes';
import { setDocumentUrl } from './actions';

declare var APP: Object;

const ETHERPAD_COMMAND = 'etherpad';

/**
 * Middleware that captures actions related to collaborative document editing
 * and notifies components not hooked into redux.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;

        conference.addCommandListener(ETHERPAD_COMMAND,
            ({ value }) => {
                let url;
                const { etherpad_base: etherpadBase } = getState()['features/base/config'];

                if (etherpadBase) {
                    url = new URL(value, etherpadBase).toString();
                }

                dispatch(setDocumentUrl(url));
            }
        );
        break;
    }
    case TOGGLE_DOCUMENT_EDITING: {
        if (typeof APP !== 'undefined') {
            APP.UI.emitEvent(UIEvents.ETHERPAD_CLICKED);
        }
        break;
    }
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. Clear messages or close the chat modal if it's left
 * open.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, previousConference) => {
        if (previousConference) {
            dispatch(setDocumentUrl(undefined));
        }
    });

// @flow

import UIEvents from '../../../service/UI/UIEvents';
import { getCurrentConference } from '../base/conference';
import { setActiveModalId } from '../base/modal';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { TOGGLE_DOCUMENT_EDITING } from './actionTypes';
import { setDocumentEditingState, setDocumentUrl } from './actions';
import { SHARE_DOCUMENT_VIEW_ID } from './constants';

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
    case TOGGLE_DOCUMENT_EDITING: {
        if (typeof APP === 'undefined') {
            const editing = !getState()['features/etherpad'].editing;

            dispatch(setDocumentEditingState(editing));

            if (editing) {
                dispatch(setActiveModalId(SHARE_DOCUMENT_VIEW_ID));
            } else if (getState()['features/base/modal'].activeModalId === SHARE_DOCUMENT_VIEW_ID) {
                dispatch(setActiveModalId(undefined));
            }
        } else {
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
    (conference, { dispatch, getState }, previousConference) => {
        if (conference) {
            conference.addCommandListener(ETHERPAD_COMMAND,
                ({ value }) => {
                    let url;
                    const { etherpad_base: etherpadBase } = getState()['features/base/config'];

                    if (etherpadBase) {
                        const u = new URL(value, etherpadBase);

                        url = u.toString();
                    }

                    dispatch(setDocumentUrl(url));
                }
            );
        }

        if (previousConference) {
            dispatch(setDocumentUrl(undefined));
        }
    });

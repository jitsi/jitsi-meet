import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { sanitizeUrl } from '../base/util/uri';

import { TOGGLE_DOCUMENT_EDITING } from './actionTypes';
import { setDocumentUrl } from './actions';

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
            ({ value }: { value: string; }) => {
                let url;
                const { etherpad_base: etherpadBase } = getState()['features/base/config'];
                const etherpadBaseUrl = sanitizeUrl(etherpadBase);

                if (etherpadBaseUrl) {
                    const urlObj = new URL(value, etherpadBaseUrl.toString());

                    // Merge query string parameters on top of internal ones
                    if (etherpadBaseUrl.search) {
                        const searchParams = new URLSearchParams(urlObj.search);

                        for (const [ key, val ] of new URLSearchParams(etherpadBaseUrl.search)) {
                            searchParams.set(key, val);
                        }
                        urlObj.search = searchParams.toString();
                    }
                    url = urlObj.toString();
                }

                dispatch(setDocumentUrl(url));
            }
        );
        break;
    }
    case TOGGLE_DOCUMENT_EDITING: {
        if (typeof APP !== 'undefined') {
            APP.UI.onEtherpadClicked();
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

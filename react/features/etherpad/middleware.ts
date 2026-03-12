import { sanitizeUrl as _sanitizePath } from '@braintree/sanitize-url';

import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { sanitizeUrl } from '../base/util/uri';

import { TOGGLE_DOCUMENT_EDITING } from './actionTypes';
import { setDocumentUrl } from './actions';
import logger from './logger';

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
                if (!value) {
                    return;
                }

                let url;
                const { etherpad_base: etherpadBase } = getState()['features/base/config'];
                const etherpadBaseUrl = sanitizeUrl(etherpadBase);

                try {
                    const newValue = _sanitizePath(value);

                    // The sanitizeUrl function will return 'about:blank' for invalid URLs
                    if (newValue !== 'about:blank' && !newValue.startsWith('//')) {
                        new URL(newValue);
                    }

                    logger.warn(`Received suspicious value for etherpad command: ${value}`);

                    return;
                } catch (e) {
                    // we should receive a relative path for the URL and should not be able to construct a url from it
                }

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

                if (typeof APP !== 'undefined') {
                    logger.log('Etherpad is enabled');
                    APP.UI.initEtherpad();
                }
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

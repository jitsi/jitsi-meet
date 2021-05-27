// @flow

import UIEvents from '../../../service/UI/UIEvents';
import { getCurrentConference } from '../base/conference';
import { setActiveModalId } from '../base/modal';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { TOGGLE_GENERICIFRAME_VISIBILITY } from './actionTypes';
import {
    setGenericIFrameVisibilityState,
    setGenericIFrameUrl
} from './actions';
import { SHARE_GENERICIFRAME_VIEW_ID } from './constants';

declare var APP: Object;

const GENERICIFRAME_COMMAND = 'genericiframe';

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
    case TOGGLE_GENERICIFRAME_VISIBILITY: {
        if (typeof APP === 'undefined') {
            const visible = !getState()['features/genericiframe'].visible;

            dispatch(setGenericIFrameVisibilityState(visible));

            if (visible) {
                dispatch(setActiveModalId(SHARE_GENERICIFRAME_VIEW_ID));
            } else if (
                getState()['features/base/modal'].activeModalId ===
                SHARE_GENERICIFRAME_VIEW_ID
            ) {
                dispatch(setActiveModalId(undefined));
            }
        } else {
            APP.UI.emitEvent(UIEvents.GENERICIFRAME_CLICKED);
        }
        break;
    }
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. clear messages or close the chat modal if it's left
 * open.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch, getState }, previousConference) => {
        if (conference) {
            conference.addCommandListener(
                GENERICIFRAME_COMMAND,
                ({ value }) => {
                    let url;
                    const {
                        genericIFrameTemplateUrl
                    } = getState()['features/base/config'];

                    if (genericIFrameTemplateUrl) {
                        const u = new URL(value, genericIFrameTemplateUrl);

                        url = u.toString();
                    }

                    dispatch(setGenericIFrameUrl(url));
                }
            );
        }

        if (previousConference) {
            dispatch(setGenericIFrameUrl(undefined));
        }
    }
);

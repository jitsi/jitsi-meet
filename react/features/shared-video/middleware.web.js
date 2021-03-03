// @flow

import UIEvents from '../../../service/UI/UIEvents';
import { getCurrentConference } from '../base/conference';
import { getLocalParticipant } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

import { TOGGLE_SHARED_VIDEO } from './actionTypes';
import { setDisableButton } from './actions.web';
import { SHARED_VIDEO } from './constants';

declare var APP: Object;

/**
 * Middleware that captures actions related to video sharing and updates
 * components not hooked into redux.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    if (typeof APP === 'undefined') {
        return next(action);
    }

    switch (action.type) {
    case TOGGLE_SHARED_VIDEO:
        APP.UI.emitEvent(UIEvents.SHARED_VIDEO_CLICKED);
        break;
    }

    return next(action);
});

/**
 * Set up state change listener to disable or enable the share video button in
 * the toolbar menu.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, store, previousConference) => {
        if (conference && conference !== previousConference) {
            conference.addCommandListener(SHARED_VIDEO,
                ({ attributes }) => {

                    const { dispatch, getState } = store;
                    const { from } = attributes;
                    const localParticipantId = getLocalParticipant(getState()).id;
                    const status = attributes.state;

                    if (status === 'playing') {
                        if (localParticipantId !== from) {
                            dispatch(setDisableButton(true));
                        }
                    } else if (status === 'stop') {
                        dispatch(setDisableButton(false));
                    }
                }
            );
        }
    }
);

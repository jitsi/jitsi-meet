// @flow

import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { playAudio } from '../base/media';
import { MiddlewareRegistry } from '../base/redux';

import { INCOMING_MSG_SOUND_ID } from './constants';

declare var APP: Object;

/**
 * Implements the middleware of the chat feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED:
        // XXX Currently there's no need to remove the listener, because
        // conference instance can not be re-used. Listener will be gone with
        // the conference instance.
        _addChatMsgListener(action.conference, store);
        break;
    }

    return next(action);
});

/**
 * Registers listener for {@link JitsiConferenceEvents.MESSAGE_RECEIVED} which
 * will play a sound on the event, given that the chat is not currently visible.
 *
 * @param {JitsiConference} conference - The conference instance on which the
 * new event listener will be registered.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @returns {void}
 * @private
 */
function _addChatMsgListener(conference, { dispatch }) {
    // XXX This code is only to be executed on web and only until the chat
    // functionality gets ported to react
    if (typeof APP !== 'undefined') {
        conference.on(
            JitsiConferenceEvents.MESSAGE_RECEIVED,
            () => {
                if (!APP.UI.isChatVisible()) {
                    dispatch(playAudio(INCOMING_MSG_SOUND_ID));
                }
            });
    }
}

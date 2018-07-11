// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';

import { INCOMING_MSG_SOUND_ID } from './constants';
import { INCOMING_MSG_SOUND_FILE } from './sounds';

declare var APP: Object;

/**
 * Implements the middleware of the chat feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        // Register the chat message sound on Web only because there's no chat
        // on mobile.
        typeof APP === 'undefined'
            || store.dispatch(
                registerSound(INCOMING_MSG_SOUND_ID, INCOMING_MSG_SOUND_FILE));
        break;

    case APP_WILL_UNMOUNT:
        // Unregister the chat message sound on Web because it's registered
        // there only.
        typeof APP === 'undefined'
            || store.dispatch(unregisterSound(INCOMING_MSG_SOUND_ID));
        break;

    case CONFERENCE_JOINED:
        typeof APP === 'undefined'
            || _addChatMsgListener(action.conference, store);
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
 * @private
 * @returns {void}
 */
function _addChatMsgListener(conference, { dispatch }) {
    // XXX Currently, there's no need to remove the listener, because the
    // JitsiConference instance cannot be reused. Hence, the listener will be
    // gone with the JitsiConference instance.
    conference.on(
        JitsiConferenceEvents.MESSAGE_RECEIVED,
        () => {
            APP.UI.isChatVisible()
                || dispatch(playSound(INCOMING_MSG_SOUND_ID));
        });
}

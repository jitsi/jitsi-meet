/* @flow */

import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { playAudio } from '../base/media';
import {
    getParticipantCount,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';

import {
    INCOMING_MSG_SOUND_ID,
    PARTICIPANT_JOINED_SOUND_ID,
    PARTICIPANT_LEFT_SOUND_ID
} from './constants';

declare var APP: Object;

/**
 * Middleware that triggers {@link playAudio} action in response to various
 * events.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED: {
        // XXX Currently there's no need to remove the listener, because
        // conference instance can not be re-used. Listener will be gone with
        // the conference instance.
        _addChatMsgListener(action.conference, store);
        break;
    }
    case PARTICIPANT_LEFT:
    case PARTICIPANT_JOINED: {
        _participantJoinedOrLeft(store, action);
        break;
    }
    }

    return next(action);
});

/**
 * Registers listener for {@link JitsiConferenceEvents.MESSAGE_RECEIVED} which
 * will play a sound on the event, given that the chat is not currently visible.
 *
 * @param {JitsiConference} conference - The conference instance on which the
 * new event listener will be registered.
 * @param {Dispatch} dispatch - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @returns {void}
 * @private
 */
function _addChatMsgListener(conference, { dispatch }) {
    // XXX This code is only to be executed on web and only until the chat
    // functionality gets ported to react (there's no react way to check if chat
    // is visible).
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

/**
 * Plays sounds when participants join/leave conference.
 *
 * @param {Store} store - The Redux store.
 * @param {Action} action - The Redux action. Should be either
 * {@link PARTICIPANT_JOINED} or {@link PARTICIPANT_LEFT}.
 * @private
 * @returns {void}
 */
function _participantJoinedOrLeft({ getState, dispatch }, action) {
    const state = getState();
    const { startAudioMuted } = state['features/base/config'];

    // We're not playing sounds for local participant
    // nor when the user is joining past the "startAudioMuted" limit.
    // The intention there was to not play user joined notification in big
    // conferences where 100th person is joining.
    if (!action.participant.local
        && (!startAudioMuted
            || getParticipantCount(state) < startAudioMuted)) {
        if (action.type === PARTICIPANT_JOINED) {
            dispatch(playAudio(PARTICIPANT_JOINED_SOUND_ID));
        } else if (action.type === PARTICIPANT_LEFT) {
            dispatch(playAudio(PARTICIPANT_LEFT_SOUND_ID));
        }
    }
}



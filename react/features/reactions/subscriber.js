// @flow

import { getCurrentConference } from '../base/conference';
import { isLocalParticipantModerator } from '../base/participants';
import { StateListenerRegistry } from '../base/redux';

import { MUTE_REACTIONS_COMMAND } from './constants';

/**
 * Subscribes to changes to the Mute Reaction Sounds setting for the local participant to
 * notify remote participants of current user interface status.
 * Changing newSelectedValue param to off, when feature is turned of so we can
 * notify all listeners.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'].startReactionsMuted,
    /* listener */ (newSelectedValue, store) => _sendMuteReactionsCommand(newSelectedValue || false, store));


/**
 * Sends the mute-reactions command, when a local property change occurs.
 *
 * @param {*} newSelectedValue - The changed selected value from the selector.
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _sendMuteReactionsCommand(newSelectedValue, store) {
    const state = store.getState();
    const conference = getCurrentConference(state);

    if (!conference) {
        return;
    }

    // Only a moderator is allowed to send commands.
    if (!isLocalParticipantModerator(state)) {
        return;
    }

    conference.sendCommand(
        MUTE_REACTIONS_COMMAND,
        { attributes: { startReactionsMuted: Boolean(newSelectedValue) } }
    );
}

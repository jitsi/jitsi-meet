// @flow

import { StateListenerRegistry } from '../base/redux';
import { getCurrentConference } from '../base/conference';
import {
    getPinnedParticipant,
    isLocalParticipantModerator
} from '../base/participants';

import { FOLLOW_ME_COMMAND } from './constants';

/**
 * Subscribes to changes to the Follow Me setting for the local participant to
 * notify remote participants of current user interface status.
 *
 * @param sharedDocumentVisible {Boolean} {true} if the shared document was
 * shown (as a result of the toggle) or {false} if it was hidden
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'].followMeEnabled,
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the currently pinned participant in the user
 * interface of the local participant.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const pinnedParticipant = getPinnedParticipant(state);

        return pinnedParticipant ? pinnedParticipant.id : null;
    },
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the shared document (etherpad) visibility in the
 * user interface of the local participant.
 *
 * @param sharedDocumentVisible {Boolean} {true} if the shared document was
 * shown (as a result of the toggle) or {false} if it was hidden
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/etherpad'].editing,
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the filmstrip visibility in the user interface of
 * the local participant.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/filmstrip'].visible,
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the tile view setting in the user interface of the
 * local participant.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/video-layout'].tileViewEnabled,
    /* listener */ _sendFollowMeCommand);

/**
 * Private selector for returning state from redux that should be respected by
 * other participants while follow me is enabled.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function _getFollowMeState(state) {
    const pinnedParticipant = getPinnedParticipant(state);

    return {
        filmstripVisible: state['features/filmstrip'].visible,
        nextOnStage: pinnedParticipant && pinnedParticipant.id,
        sharedDocumentVisible: state['features/etherpad'].editing,
        tileViewEnabled: state['features/video-layout'].tileViewEnabled
    };
}

/**
 * Sends the follow-me command, when a local property change occurs.
 *
 * @param {*} newSelectedValue - The changed selected value from the selector.
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _sendFollowMeCommand(
        newSelectedValue, store) { // eslint-disable-line no-unused-vars
    const state = store.getState();
    const conference = getCurrentConference(state);

    if (!conference || !state['features/base/conference'].followMeEnabled) {
        return;
    }

    // Only a moderator is allowed to send commands.
    if (!isLocalParticipantModerator(state)) {
        return;
    }

    // XXX The "Follow Me" command represents a snapshot of all states
    // which are to be followed so don't forget to removeCommand before
    // sendCommand!
    conference.removeCommand(FOLLOW_ME_COMMAND);
    conference.sendCommandOnce(
        FOLLOW_ME_COMMAND,
        { attributes: _getFollowMeState(state) }
    );
}

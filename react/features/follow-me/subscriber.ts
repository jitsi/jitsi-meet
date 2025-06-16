import { IReduxState, IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import {
    getPinnedParticipant,
    isLocalParticipantModerator
} from '../base/participants/functions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { getPinnedActiveParticipants, isStageFilmstripEnabled } from '../filmstrip/functions';
import { shouldDisplayTileView } from '../video-layout/functions';

import { FOLLOW_ME_COMMAND } from './constants';

/**
 * Subscribes to changes to the Follow Me setting for the local participant to
 * notify remote participants of current user interface status.
 * Changing newSelectedValue param to off, when feature is turned of so we can
 * notify all listeners.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'].followMeEnabled,
    /* listener */ (newSelectedValue, store) => _sendFollowMeCommand(newSelectedValue || 'off', store));

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
 * @param sharedDocumentVisible - {Boolean} {true} If the shared document was
 * shown (as a result of the toggle) or {false} if it was hidden.
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
 * Subscribes to changes to the stage filmstrip participants.
 */
StateListenerRegistry.register(
    /* selector */ getPinnedActiveParticipants,
    /* listener */ _sendFollowMeCommand,
    {
        deepEquals: true
    });

/**
 * Subscribes to changes to the tile view setting in the user interface of the
 * local participant.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/video-layout'].tileViewEnabled,
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the max number of stage participants setting.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/settings'].maxStageParticipants,
    /* listener */ _sendFollowMeCommand);

/**
 * Private selector for returning state from redux that should be respected by
 * other participants while follow me is enabled.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function _getFollowMeState(state: IReduxState) {
    const pinnedParticipant = getPinnedParticipant(state);
    const stageFilmstrip = isStageFilmstripEnabled(state);

    return {
        recorder: state['features/base/conference'].followMeRecorderEnabled,
        filmstripVisible: state['features/filmstrip'].visible,
        maxStageParticipants: stageFilmstrip ? state['features/base/settings'].maxStageParticipants : undefined,
        nextOnStage: pinnedParticipant?.id,
        pinnedStageParticipants: stageFilmstrip ? JSON.stringify(getPinnedActiveParticipants(state)) : undefined,
        sharedDocumentVisible: state['features/etherpad'].editing,
        tileViewEnabled: shouldDisplayTileView(state)
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
        newSelectedValue: any, store: IStore) {
    const state = store.getState();
    const conference = getCurrentConference(state);

    if (!conference) {
        return;
    }

    // Only a moderator is allowed to send commands.
    if (!isLocalParticipantModerator(state)) {
        return;
    }

    if (newSelectedValue === 'off') {
        // if the change is to off, local user turned off follow me and
        // we want to signal this

        conference.sendCommandOnce(
            FOLLOW_ME_COMMAND,
            { attributes: { off: true } }
        );

        return;
    } else if (!state['features/base/conference'].followMeEnabled) {
        return;
    }

    conference.sendCommand(
        FOLLOW_ME_COMMAND,
        { attributes: _getFollowMeState(state) }
    );
}

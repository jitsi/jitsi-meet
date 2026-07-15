import { getCurrentConference } from '../base/conference/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { toggleLobbyMode } from '../lobby/actions.any';

/**
 * NextRound: an interview should gate entry behind the interviewer. As soon as
 * the local participant is a moderator in a live conference, auto-enable the
 * Jitsi lobby so every candidate has to knock and be admitted — no manual
 * Security-menu step. Moderators bypass the lobby, so panelists are unaffected.
 */
StateListenerRegistry.register(
    /* selector */ state => Boolean(getCurrentConference(state)) && isLocalParticipantModerator(state),
    /* listener */ (isModeratorInConference, { dispatch, getState }) => {
        if (!isModeratorInConference) {
            return;
        }

        if (!getState()['features/lobby'].lobbyEnabled) {
            dispatch(toggleLobbyMode(true));
        }
    }
);

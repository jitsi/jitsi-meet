import { getCurrentConference } from '../base/conference/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { toggleLobbyMode } from '../lobby/actions.any';

import { readNextRoundContext, startAntiCheat } from './anticheat.web';

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

/**
 * NextRound anti-cheat: once the Jitsi JWT lands, decode its `context.nextround`
 * block and start activity tracking (candidate) or the live activity watch
 * (staff). The selector returns the raw JWT string — a stable primitive that
 * changes only when the token is set — so the listener fires once on token
 * arrival rather than on every state change. {@link startAntiCheat} Self-guards
 * against re-init.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/jwt']?.jwt,
    /* listener */ (jwt, { getState }) => {
        const nr = jwt ? readNextRoundContext(getState()) : null;

        if (nr) {
            startAntiCheat(nr);
        }
    }
);

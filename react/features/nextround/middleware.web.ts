import { getCurrentConference } from '../base/conference/functions';
import { getRemoteParticipants, isLocalParticipantModerator } from '../base/participants/functions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { toggleLobbyMode } from '../lobby/actions.any';

import { dismissWaitingBanner, readNextRoundContext, startAntiCheat, startWaitingBanner } from './anticheat.web';

// Display name the AI-recruiter bot joins under (matches the launcher's BOT_NAME).
const BOT_DISPLAY_NAME = 'Aina';

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

            // Prescreening candidate: show "Aina joins shortly" until the bot is in.
            startWaitingBanner(nr);
        }
    }
);

/**
 * NextRound prescreening: dismiss the candidate's "Aina joins shortly" banner as
 * soon as the bot participant is in the call. The selector returns a stable
 * boolean, so the listener fires once when the bot arrives.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        for (const p of getRemoteParticipants(state).values()) {
            if (p.name === BOT_DISPLAY_NAME) {
                return true;
            }
        }

        return false;
    },
    /* listener */ botPresent => {
        if (botPresent) {
            dismissWaitingBanner();
        }
    }
);

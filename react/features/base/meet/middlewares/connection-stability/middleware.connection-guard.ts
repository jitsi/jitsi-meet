import { AnyAction } from "redux";
import { DOMINANT_SPEAKER_CHANGED } from "../../../participants/actionTypes";
import MiddlewareRegistry from "../../../redux/MiddlewareRegistry";

/**
 * Middleware to prevent dominant speaker events when connection is unstable.
 * This prevents the cascade of "Not connected" errors that kick users out.
 */
MiddlewareRegistry.register((store) => (next) => (action: AnyAction) => {
    if (action.type === DOMINANT_SPEAKER_CHANGED) {
        const state = store.getState();
        const { connection } = state["features/base/connection"];
        const { conference } = state["features/base/conference"];

        // Check 1: Connection must exist
        if (!connection) {
            console.warn("Dominant speaker event suppressed - no connection");
            return action;
        }

        // Check 2: Conference must exist and be joined
        if (!conference) {
            console.warn("Dominant speaker event suppressed - no conference");
            return action;
        }

        // Check 3: Connection must be in a good state (has jitsi id)
        try {
            const isConnectionReady = connection && typeof connection.getJid === "function";
            if (isConnectionReady) {
                const jid = connection.getJid();
                if (!jid) {
                    console.warn("Dominant speaker event suppressed - connection not ready (no JID)");
                    return action;
                }
            }
        } catch (error) {
            console.warn("Dominant speaker event suppressed - connection error:", error);
            return action;
        }
    }

    return next(action);
});

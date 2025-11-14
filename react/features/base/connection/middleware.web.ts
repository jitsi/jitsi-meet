import { redirectToStaticPage } from '../../app/actions.any';
import { CONFERENCE_WILL_LEAVE } from "../conference/actionTypes";
import MiddlewareRegistry from "../redux/MiddlewareRegistry";

import { CONNECTION_DISCONNECTED, CONNECTION_WILL_CONNECT } from "./actionTypes";

/**
 * The feature announced so we can distinguish jibri participants.
 *
 * @type {string}
 */
export const DISCO_JIBRI_FEATURE = "http://jitsi.org/protocol/jibri";

// user hangup meeting
let isLeaveConferenceManually = false;

MiddlewareRegistry.register(({ getState, dispatch }) => (next) => (action) => {
    switch (action.type) {
        case CONNECTION_WILL_CONNECT: {
            const { connection } = action;
            const { iAmRecorder } = getState()["features/base/config"];

            if (iAmRecorder) {
                connection.addFeature(DISCO_JIBRI_FEATURE);
            }

            // @ts-ignore
            APP.connection = connection;

            isLeaveConferenceManually = false;
            console.log("isLeaveConferenceManually reset to false on new connection", isLeaveConferenceManually);
            break;
        }

        case CONFERENCE_WILL_LEAVE: {
            console.log("User is leaving conference manually, hang up button clicked");
            isLeaveConferenceManually = true;
            break;
        }

        case CONNECTION_DISCONNECTED: {
            if (isLeaveConferenceManually) {
                console.log("Connection disconnected - redirecting to home (manual hangup)");
                isLeaveConferenceManually = false;

                setTimeout(() => {
                    dispatch(redirectToStaticPage("/"));
                }, 2000);
            } else {
                console.warn("Connection disconnected unexpectedly - waiting for reconnection");
            }

            break;
        }
    }

    return next(action);
});

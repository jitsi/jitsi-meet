import { redirectToStaticPage } from '../../app/actions.any';
import { CONFERENCE_WILL_LEAVE } from "../conference/actionTypes";
import { isLeavingConferenceManually, setLeaveConferenceManually } from "../meet/general/utils/conferenceState";
import MiddlewareRegistry from "../redux/MiddlewareRegistry";

import { CONNECTION_DISCONNECTED, CONNECTION_WILL_CONNECT } from "./actionTypes";

/**
 * The feature announced so we can distinguish jibri participants.
 *
 * @type {string}
 */
export const DISCO_JIBRI_FEATURE = "http://jitsi.org/protocol/jibri";

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

            setLeaveConferenceManually(false);
            break;
        }

        case CONFERENCE_WILL_LEAVE: {
            setLeaveConferenceManually(true);
            break;
        }

        case CONNECTION_DISCONNECTED: {
            if (isLeavingConferenceManually()) {
                setLeaveConferenceManually(false);

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

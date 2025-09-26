import { redirectToStaticPage } from '../../app/actions.any';
import { showNotification } from "../../notifications/actions";
import { NOTIFICATION_TIMEOUT } from "../../notifications/constants";
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

            break;
        }

        case CONNECTION_DISCONNECTED: {
            console.log("Connection disconnected - redirecting to home");
            dispatch(
                showNotification({
                    titleKey: "dialog.conferenceDisconnectTitle",
                })
            ),
                NOTIFICATION_TIMEOUT.LONG;
            setTimeout(() => {
                dispatch(redirectToStaticPage("/"));
            }, 2000);
            break;
        }
    }

    return next(action);
});

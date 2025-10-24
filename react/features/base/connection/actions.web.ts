// @ts-expect-error
import { jitsiLocalStorage } from '@jitsi/js-utils';

import { IStore } from '../../app/types';
import { getCustomerDetails } from '../../jaas/actions.any';
import { getJaasJWT, isVpaasMeeting } from '../../jaas/functions';
import { showWarningNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
import { stopLocalVideoRecording } from '../../recording/actions.any';
import LocalRecordingManager from '../../recording/components/Recording/LocalRecordingManager.web';
import { setJWT } from '../jwt/actions';

import { LocalStorageManager } from "../meet/LocalStorageManager";
import MeetingService from "../meet/services/meeting.service";
import { _connectInternal } from "./actions.any";
import logger from './logger';

export * from "./actions.any";

/**
 * Opens new connection.
 *
 * @param {string} [id] - The XMPP user's ID (e.g. {@code user@server.com}).
 * @param {string} [password] - The XMPP user's password.
 * @returns {Function}
 */
export function connect(id?: string, password?: string) {
    return (dispatch: IStore["dispatch"], getState: IStore["getState"]) => {
        const state = getState();
        const { jwt } = state["features/base/jwt"];
        const { iAmRecorder, iAmSipGateway } = state["features/base/config"];
        // TODO: CHECK WHY USER REDUCER IS NULL IN THIS POINT, initializers are not executing as expected
        // const { user } = state["features/user"];
        const user = LocalStorageManager.instance.getUser();
        if (!iAmRecorder && !iAmSipGateway && isVpaasMeeting(state)) {
            return dispatch(getCustomerDetails())
                .then(() => {
                    if (!jwt) {
                        return getJaasJWT(state);
                    }
                })
                .then((j) => j && dispatch(setJWT(j)))
                .then(() =>
                    dispatch(
                        _connectInternal({
                            id,
                            password,
                            name: user?.name,
                            lastname: user?.lastname,
                            isAnonymous: !user,
                        })
                    )
                )
                // latest jitsi changes, test if not works current ones
                // .then(j => {
                //     j && dispatch(setJWT(j));

                //     return dispatch(_connectInternal(id, password));
                // })
                .catch(e => {
                    logger.error('Connection error', e);
                });
        }

        // used by jibri
        const usernameOverride = jitsiLocalStorage.getItem("xmpp_username_override");
        const passwordOverride = jitsiLocalStorage.getItem("xmpp_password_override");

        if (usernameOverride && usernameOverride.length > 0) {
            id = usernameOverride; // eslint-disable-line no-param-reassign
        }
        if (passwordOverride && passwordOverride.length > 0) {
            password = passwordOverride; // eslint-disable-line no-param-reassign
        }

        return dispatch(
            _connectInternal({
                id,
                password,
                name: user?.name,
                lastname: user?.lastname,
                isAnonymous: !user,
            })
        );
    };
}

/**
 * Closes connection.
 *
 * @param {boolean} [requestFeedback] - Whether to attempt showing a
 * request for call feedback.
 * @param {string} [feedbackTitle] - The feedback title.
 * @param {boolean} [notifyOnConferenceTermination] - Whether to notify
 * the user on conference termination.
 * @returns {Function}
 */
export function hangup(requestFeedback = false, roomId?: string, feedbackTitle?: string, notifyOnConferenceTermination?: boolean) {
     // XXX For web based version we use conference hanging up logic from the old app.
    return async (dispatch: IStore["dispatch"]) => {
        if (LocalRecordingManager.isRecordingLocally()) {
            dispatch(stopLocalVideoRecording());
            dispatch(
                showWarningNotification(
                    {
                        titleKey: "localRecording.stopping",
                        descriptionKey: "localRecording.wait",
                    },
                    NOTIFICATION_TIMEOUT_TYPE.STICKY
                )
            );

            // wait 1000ms for the recording to end and start downloading
            await new Promise((res) => {
                setTimeout(res, 1000);
            });
        }

        if (!roomId) {
            return Promise.reject(new Error("No roomId provided to hangup"));
        }
        MeetingService.instance.leaveCall(roomId);

        return APP.conference.hangup(requestFeedback, feedbackTitle, notifyOnConferenceTermination);
    };
}

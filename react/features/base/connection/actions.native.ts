import { appNavigate } from '../../app/actions.native';
import { IStore } from '../../app/types';
import { getCustomerDetails } from '../../jaas/actions.any';
import { getJaasJWT, isVpaasMeeting } from '../../jaas/functions';
import { replaceRoot } from '../../mobile/navigation/rootNavigationContainerRef';
import { screen } from '../../mobile/navigation/routes';
import {
    captureBackgroundConnection,
    ensureBackgroundSession,
    trackBackgroundDisconnect
} from '../../virtual-background/lifecycle';
import { setJWT } from '../jwt/actions';
import { JitsiConnectionErrors } from '../lib-jitsi-meet';

import { disconnect as disconnectInternal } from './actions.any';
import { _connectInternal } from './actions.native';
import logger from './logger';

export * from './actions.any';

/**
 * Opens new connection.
 *
 * @param {string} [id] - The XMPP user's ID (e.g. {@code user@server.com}).
 * @param {string} [password] - The XMPP user's password.
 * @returns {Function}
 */
export function connect(id?: string, password?: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const canConnect = captureBackgroundConnection({ dispatch, getState });

        try {
            if (!await ensureBackgroundSession({ dispatch, getState }) || !canConnect()) {
                return;
            }
        } catch (error) {
            logger.error('Could not activate background session', error);

            return;
        }
        const state = getState();
        const { jwt } = state['features/base/jwt'];

        if (isVpaasMeeting(state)) {
            return dispatch(getCustomerDetails())
                .then(() => {
                    if (!jwt) {
                        return getJaasJWT(state);
                    }
                })
                .then(async j => {
                    if (!canConnect() || !await ensureBackgroundSession({ dispatch, getState }) || !canConnect()) {
                        return;
                    }
                    j && dispatch(setJWT(j));

                    return dispatch(_connectInternal(id, password));
                }).catch(e => {
                    logger.error('Connection error', e);
                });
        }

        return dispatch(_connectInternal(id, password))

        .catch(error => {
            if (error === JitsiConnectionErrors.NOT_LIVE_ERROR) {
                replaceRoot(screen.visitorsQueue);
            }
        });
    };
}

/**
 * Disconnects the current connection and tracks completion for background lifecycle work.
 *
 * @param {boolean} [isRedirect] - Whether the disconnect is part of a redirect.
 * @param {boolean} [shouldLeave=true] - Whether to leave the conference while disconnecting.
 * @returns {Function} A thunk that disconnects the current connection.
 */
export function disconnect(isRedirect?: boolean, shouldLeave = true) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) =>
        trackBackgroundDisconnect({ dispatch, getState }, () => dispatch(disconnectInternal(isRedirect, shouldLeave)));
}

/**
 * Hangup.
 *
 * @param {boolean} [_requestFeedback] - Whether to attempt showing a
 * request for call feedback.
 * @returns {Function}
 */
export function hangup(_requestFeedback = false) {
    return (dispatch: IStore['dispatch']) => dispatch(appNavigate(undefined));
}

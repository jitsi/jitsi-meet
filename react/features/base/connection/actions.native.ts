import { appNavigate } from '../../app/actions.native';
import { IStore } from '../../app/types';
import { getCustomerDetails } from '../../jaas/actions.any';
import { getJaasJWT, isVpaasMeeting } from '../../jaas/functions';
import { navigateRoot } from '../../mobile/navigation/rootNavigationContainerRef';
import { screen } from '../../mobile/navigation/routes';
import { setJWT } from '../jwt/actions';
import { JitsiConnectionErrors } from '../lib-jitsi-meet';

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
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { jwt } = state['features/base/jwt'];

        if (isVpaasMeeting(state)) {
            return dispatch(getCustomerDetails())
                .then(() => {
                    if (!jwt) {
                        return getJaasJWT(state);
                    }
                })
                .then(j => {
                    j && dispatch(setJWT(j));

                    return dispatch(_connectInternal(id, password));
                }).catch(e => {
                    logger.error('Connection error', e);
                });
        }

        dispatch(_connectInternal(id, password))

        .catch(error => {
            if (error === JitsiConnectionErrors.NOT_LIVE_ERROR) {
                navigateRoot(screen.visitorsQueue);
            }
        });
    };
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

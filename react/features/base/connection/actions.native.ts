import { appNavigate } from '../../app/actions.native';
import { IStore } from '../../app/types';
import { navigateRoot } from '../../mobile/navigation/rootNavigationContainerRef';
import { screen } from '../../mobile/navigation/routes';
import { JitsiConnectionErrors } from '../lib-jitsi-meet';

import { _connectInternal } from './actions.any';

export * from './actions.any';

/**
 * Opens new connection.
 *
 * @param {string} [id] - The XMPP user's ID (e.g. {@code user@server.com}).
 * @param {string} [password] - The XMPP user's password.
 * @returns {Function}
 */
export function connect(id?: string, password?: string) {
    return (dispatch: IStore['dispatch']) => dispatch(_connectInternal(id, password))
        .catch(error => {
            if (error === JitsiConnectionErrors.NOT_LIVE_ERROR) {
                navigateRoot(screen.visitorsQueue);
            }
        });
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

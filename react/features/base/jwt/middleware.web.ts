import { IStore } from '../../app/types';
import { loginWithPopup } from '../../authentication/actions';
import LoginQuestionDialog from '../../authentication/components/web/LoginQuestionDialog';
import { getTokenAuthUrl, isTokenAuthEnabled, isTokenAuthInline } from '../../authentication/functions';
import { hideNotification, showNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../../notifications/constants';
import { CONNECTION_TOKEN_EXPIRED } from '../connection/actionTypes';
import { openDialog } from '../dialog/actions';
import { browser } from '../lib-jitsi-meet';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { parseURIString } from '../util/uri';

import { setJWT } from './actions';
import logger from './logger';

const PROMPT_LOGIN_NOTIFICATION_ID = 'PROMPT_LOGIN_NOTIFICATION_ID';

/**
 * Middleware to handle token expiration on web - prompts the user to re-authenticate.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => next => action => {
    if (action.type === CONNECTION_TOKEN_EXPIRED) {
        const state = store.getState();
        const jwt = state['features/base/jwt'].jwt;
        const refreshToken = state['features/base/jwt'].refreshToken;

        if (typeof APP !== 'undefined' && jwt && isTokenAuthEnabled(state)) {
            const { connection, locationURL = { href: '' } as URL } = state['features/base/connection'];
            const { tenant } = parseURIString(locationURL.href) || {};
            const room = state['features/base/conference'].room;
            const dispatch = store.dispatch;

            getTokenAuthUrl(
                state['features/base/config'],
                locationURL,
                {
                    audioMuted: false,
                    audioOnlyEnabled: false,
                    skipPrejoin: true,
                    videoMuted: false
                },
                room,
                tenant,
                refreshToken
            )
                .then((url: string | undefined) => {
                    if (url) {
                        dispatch(showNotification({
                            descriptionKey: 'dialog.loginOnResume',
                            titleKey: 'dialog.login',
                            uid: PROMPT_LOGIN_NOTIFICATION_ID,
                            customActionNameKey: [ 'dialog.login' ],
                            customActionHandler: [ () => {
                                store.dispatch(hideNotification(PROMPT_LOGIN_NOTIFICATION_ID));

                                if (isTokenAuthInline(state['features/base/config'])) {
                                    loginWithPopup(url)
                                        .then((result: { accessToken: string; idToken: string; refreshToken?: string; }) => {
                                            const token: string = result.accessToken;
                                            const idToken: string = result.idToken;
                                            const newRefreshToken: string | undefined = result.refreshToken;

                                            dispatch(setJWT(token, idToken, newRefreshToken || refreshToken));

                                            connection?.refreshToken(token)
                                                .catch((err: any) => {
                                                    dispatch(setJWT());
                                                    logger.error(err);
                                                });
                                        }).catch(logger.error);
                                } else {
                                    dispatch(openDialog('LoginQuestionDialog', LoginQuestionDialog, {
                                        handler: () => {
                                            // Give time for the dialog to close.
                                            setTimeout(() => {
                                                if (browser.isElectron()) {
                                                    window.open(url, '_blank');
                                                } else {
                                                    window.location.href = url;
                                                }
                                            }, 500);
                                        }
                                    }));
                                }

                            } ],
                            appearance: NOTIFICATION_TYPE.ERROR
                        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
                    }
                })
                .catch(logger.error);
        }
    }

    return next(action);
});

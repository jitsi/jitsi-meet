// @ts-expect-error
import jwtDecode from 'jwt-decode';
import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import { loginWithPopup } from '../../authentication/actions';
import LoginQuestionDialog from '../../authentication/components/web/LoginQuestionDialog';
import { getTokenAuthUrl, isTokenAuthInline } from '../../authentication/functions';
import { isVpaasMeeting } from '../../jaas/functions';
import { hideNotification, showNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../../notifications/constants';
import { authStatusChanged } from '../conference/actions.any';
import { getCurrentConference } from '../conference/functions';
import { SET_CONFIG } from '../config/actionTypes';
import { CONNECTION_ESTABLISHED, CONNECTION_TOKEN_EXPIRED, SET_LOCATION_URL } from '../connection/actionTypes';
import { openDialog } from '../dialog/actions';
import { browser } from '../lib-jitsi-meet';
import { participantUpdated } from '../participants/actions';
import { getLocalParticipant } from '../participants/functions';
import { IParticipant } from '../participants/types';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import StateListenerRegistry from '../redux/StateListenerRegistry';
import { parseURIString } from '../util/uri';

import { SET_JWT } from './actionTypes';
import { setDelayedLoadOfAvatarUrl, setJWT, setKnownAvatarUrl } from './actions';
import { JWT_VALIDATION_ERRORS } from './constants';
import { parseJWTFromURLParams, validateJwt } from './functions';
import logger from './logger';

const PROMPT_LOGIN_NOTIFICATION_ID = 'PROMPT_LOGIN_NOTIFICATION_ID';

/**
 * Set up a state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. Clear any delayed load avatar url.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, previousConference): void => {
        if (conference !== previousConference) {
            dispatch(setDelayedLoadOfAvatarUrl());
        }
    });

/**
 * Middleware to parse token data upon setting a new room URL.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const state = store.getState();

    switch (action.type) {
    case SET_CONFIG:
    case SET_LOCATION_URL:
        // XXX The JSON Web Token (JWT) is not the only piece of state that we
        // have decided to store in the feature jwt
        return _setConfigOrLocationURL(store, next, action);
    case CONNECTION_TOKEN_EXPIRED: {
        const jwt = state['features/base/jwt'].jwt;
        const refreshToken = state['features/base/jwt'].refreshToken;

        if (typeof APP !== 'undefined' && jwt
                && validateJwt(jwt).find((e: any) => e.key === JWT_VALIDATION_ERRORS.TOKEN_EXPIRED)) {
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
                    skipPrejoin: false,
                    videoMuted: false
                },
                room,
                tenant,
                refreshToken
            )
                .then((url: string | undefined) => {
                    if (url) {
                        // only if it is inline token auth and token is about to expire
                        // if not expired yet use it to refresh the token
                        dispatch(showNotification({
                            descriptionKey: 'dialog.loginOnResume',
                            titleKey: 'dialog.login',
                            uid: PROMPT_LOGIN_NOTIFICATION_ID,
                            customActionNameKey: [ 'dialog.login' ],
                            customActionHandler: [ () => {
                                store.dispatch(hideNotification(PROMPT_LOGIN_NOTIFICATION_ID));

                                if (isTokenAuthInline(state['features/base/config'])) {
                                    // Use refresh token if available, otherwise fall back to silent login
                                    loginWithPopup(url)
                                        .then((result: { accessToken: string; idToken: string; refreshToken?: string; }) => {
                                            // @ts-ignore
                                            const token: string = result.accessToken;
                                            const idToken: string = result.idToken;
                                            const newRefreshToken: string | undefined = result.refreshToken;

                                            // @ts-ignore
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
        break;
    }
    case CONNECTION_ESTABLISHED: {
        const delayedLoadOfAvatarUrl = state['features/base/jwt'].delayedLoadOfAvatarUrl;

        if (delayedLoadOfAvatarUrl) {
            _overwriteLocalParticipant(store, {
                avatarURL: delayedLoadOfAvatarUrl
            });
            store.dispatch(setDelayedLoadOfAvatarUrl());
            store.dispatch(setKnownAvatarUrl(delayedLoadOfAvatarUrl));
        }
        break;
    }
    case SET_JWT:
        return _setJWT(store, next, action);
    }

    return next(action);
});

/**
 * Overwrites the properties {@code avatarURL}, {@code email}, and {@code name}
 * of the local participant stored in the redux state base/participants.
 *
 * @param {Store} store - The redux store.
 * @param {Object} localParticipant - The {@code Participant} structure to
 * overwrite the local participant stored in the redux store base/participants
 * with.
 * @private
 * @returns {void}
 */
function _overwriteLocalParticipant(
        { dispatch, getState }: IStore,
        { avatarURL, email, id: jwtId, name, features }:
        { avatarURL?: string; email?: string; features?: any; id?: string; name?: string; }) {
    let localParticipant;

    if ((avatarURL || email || name || features) && (localParticipant = getLocalParticipant(getState))) {
        const newProperties: IParticipant = {
            id: localParticipant.id,
            local: true
        };

        if (avatarURL) {
            newProperties.avatarURL = avatarURL;
        }
        if (email) {
            newProperties.email = email;
        }
        if (jwtId) {
            newProperties.jwtId = jwtId;
        }
        if (name) {
            newProperties.name = name;
        }
        if (features) {
            newProperties.features = features;
        }
        dispatch(participantUpdated(newProperties));
    }
}

/**
 * Notifies the feature jwt that the action {@link SET_CONFIG} or
 * {@link SET_LOCATION_URL} is being dispatched within a specific redux
 * {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_CONFIG} or
 * {@code SET_LOCATION_URL} which is being dispatched in the specified
 * {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _setConfigOrLocationURL({ dispatch, getState }: IStore, next: Function, action: AnyAction) {
    const result = next(action);

    const { locationURL } = getState()['features/base/connection'];

    dispatch(
        setJWT(locationURL ? parseJWTFromURLParams(locationURL) : undefined));

    return result;
}

/**
 * Notifies the feature jwt that the action {@link SET_JWT} is being dispatched
 * within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code SET_JWT} which is being
 * dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _setJWT(store: IStore, next: Function, action: AnyAction) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { idToken, jwt, refreshToken, type, ...actionPayload } = action;

    if (!Object.keys(actionPayload).length) {
        const state = store.getState();

        if (jwt) {
            let jwtPayload;

            try {
                jwtPayload = jwtDecode(jwt);
            } catch (e) {
                logger.error(e);
            }

            if (jwtPayload) {
                const { context, iss, sub } = jwtPayload;
                const { tokenGetUserInfoOutOfContext, tokenRespectTenant } = state['features/base/config'];

                action.jwt = jwt;
                action.issuer = iss;
                if (context) {
                    const user = _user2participant(context.user || {});

                    action.callee = context.callee;
                    action.group = context.group;
                    action.server = context.server;
                    action.tenant = context.tenant || sub || undefined;
                    action.user = user;

                    const newUser = user ? { ...user } : {};

                    let features = context.features;

                    // eslint-disable-next-line max-depth
                    if (!isVpaasMeeting(state) && tokenRespectTenant && context.tenant) {
                        // we skip checking vpaas meetings as there are other backend rules in place
                        // this way vpaas users can still use this field if needed
                        const { locationURL = { href: '' } as URL } = state['features/base/connection'];
                        const { tenant = '' } = parseURIString(locationURL.href) || {};

                        features = context.tenant === tenant || tenant === '' ? features : {};
                    }

                    if (newUser.avatarURL) {
                        const { knownAvatarUrl } = state['features/base/jwt'];

                        if (knownAvatarUrl !== newUser.avatarURL) {
                            store.dispatch(setDelayedLoadOfAvatarUrl(newUser.avatarURL));

                            newUser.avatarURL = undefined;
                        }
                    }

                    _overwriteLocalParticipant(
                        store, { ...newUser,
                            features });

                    // eslint-disable-next-line max-depth
                    if (context.user && context.user.role === 'visitor') {
                        action.preferVisitor = true;
                    }
                } else if (jwtPayload.name || jwtPayload.picture || jwtPayload.email) {
                    if (tokenGetUserInfoOutOfContext) {
                        // there are some tokens (firebase) having picture and name on the main level.
                        _overwriteLocalParticipant(store, {
                            avatarURL: jwtPayload.picture,
                            name: jwtPayload.name,
                            email: jwtPayload.email
                        });
                    }

                    store.dispatch(authStatusChanged(true, jwtPayload.email));
                }
            }
        } else {
            if (typeof APP === 'undefined') {
                // The logic of restoring JWT overrides make sense only on mobile.
                // On Web it should eventually be restored from storage, but there's
                // no such use case yet.

                const { user } = state['features/base/jwt'];

                user && _undoOverwriteLocalParticipant(store, user);
            }

            // clears authLogin
            store.dispatch(authStatusChanged(true));
        }
    }

    return next(action);
}

/**
 * Undoes/resets the values overwritten by {@link _overwriteLocalParticipant}
 * by either clearing them or setting to default values. Only the values that
 * have not changed since the overwrite happened will be restored.
 *
 * NOTE Once it is possible to edit and save participant properties, this
 * function should restore values from the storage instead.
 *
 * @param {Store} store - The redux store.
 * @param {Object} localParticipant - The {@code Participant} structure used
 * previously to {@link _overwriteLocalParticipant}.
 * @private
 * @returns {void}
 */
function _undoOverwriteLocalParticipant(
        { dispatch, getState }: IStore,
        { avatarURL, name, email }: { avatarURL?: string; email?: string; name?: string; }) {
    let localParticipant;

    if ((avatarURL || name || email)
            && (localParticipant = getLocalParticipant(getState))) {
        const newProperties: IParticipant = {
            id: localParticipant.id,
            local: true
        };

        if (avatarURL === localParticipant.avatarURL) {
            newProperties.avatarURL = undefined;
        }
        if (email === localParticipant.email) {
            newProperties.email = undefined;
        }
        if (name === localParticipant.name) {
            newProperties.name = undefined;
        }
        newProperties.features = undefined;

        dispatch(participantUpdated(newProperties));
    }
}

/**
 * Converts the JWT {@code context.user} structure to the {@code Participant}
 * structure stored in the redux state base/participants.
 *
 * @param {Object} user - The JWT {@code context.user} structure to convert.
 * @private
 * @returns {{
 *     avatarURL: ?string,
 *     email: ?string,
 *     id: ?string,
 *     name: ?string,
 *     hidden-from-recorder: ?boolean
 * }}
 */
function _user2participant({ avatar, avatarUrl, email, id, name, 'hidden-from-recorder': hiddenFromRecorder }:
{ avatar?: string; avatarUrl?: string; email: string; 'hidden-from-recorder': string | boolean;
    id: string; name: string; }) {
    const participant: {
        avatarURL?: string;
        email?: string;
        hiddenFromRecorder?: boolean;
        id?: string;
        name?: string;
    } = {};

    if (typeof avatarUrl === 'string') {
        participant.avatarURL = avatarUrl.trim();
    } else if (typeof avatar === 'string') {
        participant.avatarURL = avatar.trim();
    }
    if (typeof email === 'string') {
        participant.email = email.trim();
    }
    if (typeof id === 'string') {
        participant.id = id.trim();
    }
    if (typeof name === 'string') {
        participant.name = name.trim();
    }

    if (hiddenFromRecorder === 'true' || hiddenFromRecorder === true) {
        participant.hiddenFromRecorder = true;
    }

    return Object.keys(participant).length ? participant : undefined;
}

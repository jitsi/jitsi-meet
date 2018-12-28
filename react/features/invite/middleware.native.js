// @flow

import i18next from 'i18next';
import { NativeEventEmitter, NativeModules } from 'react-native';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT, getAppProp } from '../base/app';
import { MiddlewareRegistry } from '../base/redux';

import { invite } from './actions';
import {
    BEGIN_ADD_PEOPLE,
    _SET_EMITTER_SUBSCRIPTIONS
} from './actionTypes';
import {
    getInviteResultsForQuery,
    isAddPeopleEnabled,
    isDialOutEnabled
} from './functions';
import './middleware.any';

/**
 * The react-native module of the feature invite.
 */
const { Invite } = NativeModules;

/**
 * The middleware of the feature invite specific to mobile/react-native.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
Invite && MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case _SET_EMITTER_SUBSCRIPTIONS:
        return _setEmitterSubscriptions(store, next, action);

    case APP_WILL_MOUNT:
        return _appWillMount(store, next, action);

    case APP_WILL_UNMOUNT: {
        const result = next(action);

        store.dispatch({
            type: _SET_EMITTER_SUBSCRIPTIONS,
            emitterSubscriptions: undefined
        });

        return result;
    }

    case BEGIN_ADD_PEOPLE:
        return _beginAddPeople(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature jwt that the action {@link APP_WILL_MOUNT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code APP_WILL_MOUNT} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _appWillMount({ dispatch, getState }, next, action) {
    const result = next(action);

    const emitter = new NativeEventEmitter(Invite);
    const context = {
        dispatch,
        getState
    };

    dispatch({
        type: _SET_EMITTER_SUBSCRIPTIONS,
        emitterSubscriptions: [
            emitter.addListener(
                'org.jitsi.meet:features/invite#invite',
                _onInvite,
                context),
            emitter.addListener(
                'org.jitsi.meet:features/invite#performQuery',
                _onPerformQuery,
                context)
        ]
    });

    return result;
}

/**
 * Notifies the feature invite that the action {@link BEGIN_ADD_PEOPLE} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code BEGIN_ADD_PEOPLE} which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _beginAddPeople(store, next, action) {
    const result = next(action);

    // The JavaScript App needs to provide uniquely identifying information to
    // the native Invite module so that the latter may match the former to the
    // native JitsiMeetView which hosts it.
    const externalAPIScope = getAppProp(store, 'externalAPIScope');

    externalAPIScope && Invite.beginAddPeople(externalAPIScope);

    return result;
}

/**
 * Handles the {@code invite} event of the feature invite and invites specific
 * invitees to the current, ongoing conference.
 *
 * @param {Object} event - The details of the event.
 * @returns {void}
 */
function _onInvite({ addPeopleControllerScope, externalAPIScope, invitees }) {
    const { dispatch, getState } = this; // eslint-disable-line no-invalid-this

    // If there are multiple JitsiMeetView instances alive, they will all get
    // the event, since there is a single bridge, so make sure we don't act if
    // the event is not for us.
    if (getAppProp(getState, 'externalAPIScope') !== externalAPIScope) {
        return;
    }

    dispatch(invite(invitees))
        .then(failedInvitees =>
            Invite.inviteSettled(
                externalAPIScope,
                addPeopleControllerScope,
                failedInvitees));
}

/**
 * Handles the {@code performQuery} event of the feature invite and queries for
 * invitees who may subsequently be invited to the current, ongoing conference.
 *
 * @param {Object} event - The details of the event.
 * @returns {void}
 */
function _onPerformQuery(
        { addPeopleControllerScope, externalAPIScope, query }) {
    const { getState } = this; // eslint-disable-line no-invalid-this
    const state = getState();

    // If there are multiple JitsiMeetView instances alive, they will all get
    // the event, since there is a single bridge, so make sure we don't act if
    // the event is not for us.
    if (getAppProp(state, 'externalAPIScope') !== externalAPIScope) {
        return;
    }

    const {
        dialOutAuthUrl,
        peopleSearchQueryTypes,
        peopleSearchUrl
    } = state['features/base/config'];
    const options = {
        dialOutAuthUrl,
        addPeopleEnabled: isAddPeopleEnabled(state),
        dialOutEnabled: isDialOutEnabled(state),
        jwt: state['features/base/jwt'].jwt,
        peopleSearchQueryTypes,
        peopleSearchUrl
    };

    getInviteResultsForQuery(query, options)
        .catch(() => [])
        .then(results => {
            const translatedResults = results.map(result => {
                if (result.type === 'phone') {
                    result.title = i18next.t('addPeople.telephone', {
                        number: result.number
                    });

                    if (result.showCountryCodeReminder) {
                        result.subtitle = i18next.t(
                            'addPeople.countryReminder'
                        );
                    }
                }

                return result;
            }).filter(result => result.type !== 'phone' || result.allowed);

            Invite.receivedResults(
                externalAPIScope,
                addPeopleControllerScope,
                query,
                translatedResults);
        });
}

/**
 * Notifies the feature invite that the action
 * {@link _SET_EMITTER_SUBSCRIPTIONS} is being dispatched within a specific
 * redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code _SET_EMITTER_SUBSCRIPTIONS}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {*}
 */
function _setEmitterSubscriptions({ getState }, next, action) {
    const { emitterSubscriptions } = getState()['features/invite'];

    if (emitterSubscriptions) {
        for (const subscription of emitterSubscriptions) {
            subscription.remove();
        }
    }

    return next(action);
}

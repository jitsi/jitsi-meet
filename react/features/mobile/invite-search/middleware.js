/* @flow */

import i18next from 'i18next';
import { NativeModules, NativeEventEmitter } from 'react-native';

import { MiddlewareRegistry } from '../../base/redux';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../app';
import { getInviteURL } from '../../base/connection';
import {
    getInviteResultsForQuery,
    isAddPeopleEnabled,
    isDialOutEnabled,
    sendInvitesForItems
} from '../../invite';
import { inviteVideoRooms } from '../../videosipgw';

import { sendInviteSuccess, sendInviteFailure } from './actions';
import {
    _SET_INVITE_SEARCH_SUBSCRIPTIONS,
    LAUNCH_NATIVE_INVITE,
    SEND_INVITE_SUCCESS,
    SEND_INVITE_FAILURE
} from './actionTypes';

/**
 * Middleware that captures Redux actions and uses the InviteSearch module to
 * turn them into native events so the application knows about them.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {

    case APP_WILL_MOUNT:
        return _appWillMount(store, next, action);

    case APP_WILL_UNMOUNT:
        store.dispatch({
            type: _SET_INVITE_SEARCH_SUBSCRIPTIONS,
            subscriptions: undefined
        });
        break;

    case LAUNCH_NATIVE_INVITE:
        launchNativeInvite(store);
        break;

    case SEND_INVITE_SUCCESS:
        onSendInviteSuccess(action);
        break;

    case SEND_INVITE_FAILURE:
        onSendInviteFailure(action);
        break;
    }

    return result;
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
 * @returns {*}
 */
function _appWillMount({ dispatch, getState }, next, action) {
    const result = next(action);

    const emitter = new NativeEventEmitter(NativeModules.InviteSearch);

    const context = {
        dispatch,
        getState
    };
    const subscriptions = [
        emitter.addListener(
            'performQueryAction',
            _onPerformQueryAction,
            context),
        emitter.addListener(
            'performSubmitInviteAction',
            _onPerformSubmitInviteAction,
            context)
    ];

    dispatch({
        type: _SET_INVITE_SEARCH_SUBSCRIPTIONS,
        subscriptions
    });

    return result;
}

/**
 * Sends a request to the native counterpart of InviteSearch to launch a native.
 * invite search.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function launchNativeInvite(store: { getState: Function }) {
    // The JavaScript App needs to provide uniquely identifying information
    // to the native module so that the latter may match the former
    // to the native JitsiMeetView which hosts it.
    const { app } = store.getState()['features/app'];

    if (app) {
        const { externalAPIScope } = app.props;

        if (externalAPIScope) {
            NativeModules.InviteSearch.launchNativeInvite(externalAPIScope);
        }
    }
}

/**
 * Sends a notification to the native counterpart of InviteSearch that all
 * invites were sent successfully.
 *
 * @param  {Object} action - The redux action {@code SEND_INVITE_SUCCESS} which
 * is being dispatched.
 * @returns {void}
 */
function onSendInviteSuccess({ inviteScope }) {
    NativeModules.InviteSearch.inviteSucceeded(inviteScope);
}

/**
 * Sends a notification to the native counterpart of InviteSearch that some
 * invite items failed to send successfully.
 *
 * @param  {Object} action - The redux action {@code SEND_INVITE_FAILURE} which
 * is being dispatched.
 * @returns {void}
 */
function onSendInviteFailure({ items, inviteScope }) {
    NativeModules.InviteSearch.inviteFailedForItems(items, inviteScope);
}

/**
 * Handles InviteSearch's event {@code performQueryAction}.
 *
 * @param {Object} event - The details of the InviteSearch event
 * {@code performQueryAction}.
 * @returns {void}
 */
function _onPerformQueryAction({ query, inviteScope }) {
    const { getState } = this; // eslint-disable-line no-invalid-this

    const state = getState();

    const {
        dialOutAuthUrl,
        peopleSearchQueryTypes,
        peopleSearchUrl
    } = state['features/base/config'];

    const options = {
        dialOutAuthUrl,
        enableAddPeople: isAddPeopleEnabled(state),
        enableDialOut: isDialOutEnabled(state),
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

            NativeModules.InviteSearch.receivedResults(
                translatedResults,
                query,
                inviteScope);
        });
}

/**
 * Handles InviteSearch's event {@code performSubmitInviteAction}.
 *
 * @param {Object} event - The details of the InviteSearch event.
 * @returns {void}
 */
function _onPerformSubmitInviteAction({ selectedItems, inviteScope }) {
    const { dispatch, getState } = this; // eslint-disable-line no-invalid-this
    const state = getState();
    const { conference } = state['features/base/conference'];
    const {
        inviteServiceUrl
    } = state['features/base/config'];
    const options = {
        conference,
        inviteServiceUrl,
        inviteUrl: getInviteURL(state),
        inviteVideoRooms,
        jwt: state['features/base/jwt'].jwt
    };

    sendInvitesForItems(selectedItems, options)
        .then(invitesLeftToSend => {
            if (invitesLeftToSend.length) {
                dispatch(sendInviteFailure(invitesLeftToSend, inviteScope));
            } else {
                dispatch(sendInviteSuccess(inviteScope));
            }
        });
}

import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import { SET_CONFIG } from '../config/actionTypes';
import { SET_NETWORK_INFO } from '../net-info/actionTypes';
import { PARTICIPANT_LEFT } from '../participants/actionTypes';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import JitsiMeetJS from './_';
import { disposeLib, initLib } from './actions';

/**
 * Middleware that captures PARTICIPANT_LEFT action for a local participant
 * (which signalizes that we finally left the app) and disposes lib-jitsi-meet.
 * Also captures SET_CONFIG action and disposes previous instance (if any) of
 * lib-jitsi-meet, and initializes a new one with new config.
 *
 * @param {Store} store - Redux store.
 * @private
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case SET_NETWORK_INFO:
        JitsiMeetJS.setNetworkInfo({
            isOnline: action.isOnline
        });
        break;

    case PARTICIPANT_LEFT:
        action.participant.local && store.dispatch(disposeLib());
        break;

    case SET_CONFIG:
        return _setConfig(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature base/lib-jitsi-meet that the action SET_CONFIG is being
 * dispatched within a specific Redux store.
 *
 * @param {Store} store - The Redux store in which the specified action is being
 * dispatched.
 * @param {Dispatch} next - The Redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The Redux action SET_CONFIG which is being
 * dispatched in the specified store.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified action.
 */
function _setConfig({ dispatch, getState }: IStore, next: Function, action: AnyAction) {
    const { initialized } = getState()['features/base/lib-jitsi-meet'];

    // XXX Since the config is changing, the library lib-jitsi-meet must be
    // initialized again with the new config. Consequently, it may need to be
    // disposed of first.
    // TODO Currently, disposeLib actually does not dispose of lib-jitsi-meet
    // because lib-jitsi-meet does not implement such functionality.
    if (initialized) {
        dispatch(disposeLib());
    }

    // Let the new config into the Redux store (because initLib will read it
    // from there).
    const result = next(action);

    dispatch(initLib());

    return result;
}

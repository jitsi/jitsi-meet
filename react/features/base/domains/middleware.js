// @flow

import { APP_WILL_MOUNT } from '../../app';
import { SET_ROOM } from '../conference';
import { MiddlewareRegistry } from '../redux';
import { parseURIString } from '../util';

import { addKnownDomains } from './actions';
import { JITSI_KNOWN_DOMAINS } from './constants';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {

    case APP_WILL_MOUNT:
        _ensureDefaultServer(store);
        break;

    case SET_ROOM:
        _parseAndAddKnownDomain(store);
        break;
    }

    return result;
});

/**
 * Ensures presence of the default server in the known domains list.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {Promise}
 */
function _ensureDefaultServer({ dispatch, getState }) {
    const { app } = getState()['features/app'];
    const defaultURL = parseURIString(app._getDefaultURL());

    dispatch(addKnownDomains([
        defaultURL.host,
        ...JITSI_KNOWN_DOMAINS
    ]));
}

/**
 * Retrieves the domain name of a room upon join and stores it in the known
 * domain list, if not present yet.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {Promise}
 */
function _parseAndAddKnownDomain({ dispatch, getState }) {
    const { locationURL } = getState()['features/base/connection'];

    locationURL
        && locationURL.host
        && dispatch(addKnownDomains(locationURL.host));
}

// @ts-ignore
import { getDefaultURL } from '../../app/functions';
import { IStore } from '../../app/types';
import { APP_WILL_MOUNT } from '../app/actionTypes';
import { SET_ROOM } from '../conference/actionTypes';
import { SET_CONFIG } from '../config/actionTypes';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { parseURIString } from '../util/uri';

import { addKnownDomains } from './actions';


/**
 * The default list of domains known to the feature base/known-domains.
 * Generally, it should be in sync with the domains associated with the app
 * through its manifest (in other words, Universal Links, deep linking). Anyway,
 * we need a hardcoded list because it has proven impossible to programmatically
 * read the information out of the app's manifests: App Store strips the
 * associated domains manifest out of the app so it's never downloaded on the
 * client and we did not spend a lot of effort to read the associated domains
 * out of the Android manifest.
 */
export const DEFAULT_KNOWN_DOMAINS = [
    'alpha.jitsi.net',
    'beta.meet.jit.si',
    'meet.jit.si',
    '8x8.vc'
];


MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        _appWillMount(store);
        break;

    case SET_ROOM:
        _setRoom(store);
        break;

    case SET_CONFIG:
        _setConfig(store);
        break;
    }

    return result;
});

/**
 * Adds the domain of the app's {@code defaultURL} to the list of domains known
 * to the feature base/known-domains.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _appWillMount({ dispatch, getState }: IStore) {
    const defaultURL = parseURIString(getDefaultURL(getState));

    dispatch(addKnownDomains(defaultURL?.host));
}

/**
 * Adds the domain of {@code locationURL} to the list of domains known to the
 * feature base/known-domains.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _setRoom({ dispatch, getState }: IStore) {
    const { locationURL } = getState()['features/base/connection'];
    let host;

    locationURL
        && (host = locationURL.host)
        && dispatch(addKnownDomains(host));
}

/**
 * Adds default domains to the list of domains known to the feature
 * base/known-domains.
 *
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _setConfig({ dispatch, getState }: IStore) {
    const state = getState();
    const { defaultKnownDomains = DEFAULT_KNOWN_DOMAINS } = state['features/base/config'];

    dispatch(addKnownDomains(defaultKnownDomains));
}

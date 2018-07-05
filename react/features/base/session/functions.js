// @flow

import { toState } from '../redux';
import { toURLString } from '../util';

/**
 * FIXME.
 *
 * @param {Function|Object} stateful - FIXME.
 * @param {string} url - FIXME.
 * @returns {*}
 */
export function getSession(stateful: Function | Object, url: string): ?Object {
    const state = toState(stateful);

    const session = state['features/base/session'].get(url);

    if (!session) {
        console.info(`SESSION NOT FOUND FOR URL: ${url}`);
    }

    return session;
}

/**
 * FIXME.
 *
 * @param {Function | Object} stateful - FIXME.
 * @returns {Object}
 */
export function getCurrentSession(stateful: Function | Object): ?Object {
    const state = toState(stateful);
    const { locationURL } = state['features/base/config'];

    return getSession(state, toURLString(locationURL));
}

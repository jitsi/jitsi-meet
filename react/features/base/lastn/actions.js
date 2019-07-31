// @flow

import { SET_LASTN } from './actionTypes';

import type { Dispatch } from 'redux';

/**
 * Sets the video channel's last N (value) of the current conference. A value of
 * undefined shall be used to reset it to the default value.
 *
 * @param {(number|undefined)} lastN - The last N value to be set.
 * @returns {Function}
 */
export function setLastN(lastN: ?number) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        if (typeof lastN === 'undefined') {
            const config = getState()['features/base/config'];

            /* eslint-disable no-param-reassign */

            lastN = config.channelLastN;
            if (typeof lastN === 'undefined') {
                lastN = -1;
            }

            /* eslint-enable no-param-reassign */
        }

        dispatch({
            type: SET_LASTN,
            lastN
        });
    };
}

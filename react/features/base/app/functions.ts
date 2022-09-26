import { toState } from '../redux/functions';

import { IStateful } from './types';

/**
 * Gets the value of a specific React {@code Component} prop of the currently
 * mounted {@link App}.
 *
 * @param {IStateful} stateful - The redux store or {@code getState}
 * function.
 * @param {string} propName - The name of the React {@code Component} prop of
 * the currently mounted {@code App} to get.
 * @returns {*} The value of the specified React {@code Component} prop of the
 * currently mounted {@code App}.
 */
export function getAppProp(stateful: IStateful, propName: string) {
    const state = toState(stateful)['features/base/app'];

    if (state) {
        const { app } = state;

        if (app) {
            return app.props[propName];
        }
    }

    return undefined;
}

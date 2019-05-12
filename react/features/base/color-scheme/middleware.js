// @flow

import { MiddlewareRegistry } from '../redux';

import { SET_COLOR_SCHEME } from './actionTypes';
import ColorSchemeRegistry from './ColorSchemeRegistry';

/**
 * The middleware of the feature {@code base/color-scheme}.
 *
 * @returns {Function}
 */
MiddlewareRegistry.register((/* store */) => next => action => {
    switch (action.type) {
    case SET_COLOR_SCHEME:
        return ColorSchemeRegistry.clear();
    }

    return next(action);
});

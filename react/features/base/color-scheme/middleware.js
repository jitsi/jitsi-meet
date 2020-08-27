// @flow

import { MiddlewareRegistry } from '../redux';

import ColorSchemeRegistry from './ColorSchemeRegistry';
import { SET_COLOR_SCHEME } from './actionTypes';

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

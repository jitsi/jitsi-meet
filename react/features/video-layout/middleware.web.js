import { MiddlewareRegistry } from '../base/redux';

/**
 * Middleware which intercepts actions and updates the legacy component
 * {@code VideoLayout} as needed. The purpose of this middleware is to redux-ify
 * {@code VideoLayout} without having to simultaneously react-ifying it.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => next(action));

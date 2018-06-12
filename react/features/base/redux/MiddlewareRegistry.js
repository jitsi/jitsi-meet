/* @flow */

import { applyMiddleware } from 'redux';
import type { Middleware } from 'redux';

/**
 * A registry for Redux middleware, allowing features to register their
 * middleware without needing to create additional inter-feature dependencies.
 */
class MiddlewareRegistry {
    _elements: Array<Middleware<*, *>>;
    _elements2: Array<Middleware<*, *>>;

    /**
     * Creates a MiddlewareRegistry instance.
     */
    constructor() {
        /**
         * The set of registered middleware.
         *
         * @private
         * @type {Middleware[]}
         */
        this._elements = [];

        /**
         * The secondary layer of registered middleware which is executed after
         * middleware stored in {@link #_elements}.
         *
         * @private
         * @type {Middleware[]}
         */
        this._elements2 = [];
    }

    /**
     * Applies all registered middleware into a store enhancer.
     * (@link http://redux.js.org/docs/api/applyMiddleware.html).
     *
     * @param {Middleware[]} additional - Any additional middleware that need to
     * be included (such as middleware from third-party modules).
     * @returns {Middleware}
     */
    applyMiddleware(...additional: Array<Middleware<*, *>>) {
        // XXX The explicit definition of the local variable middlewares is to
        // satisfy flow.
        const middlewares = [
            ...this._elements,
            ...additional,
            ...this._elements2
        ];

        return applyMiddleware(...middlewares);
    }

    /**
     * Adds a middleware to the registry.
     *
     * The method is to be invoked only before {@link #applyMiddleware()}.
     *
     * @param {Middleware} middleware - A Redux middleware.
     * @returns {void}
     */
    register(middleware: Middleware<*, *>) {
        this._elements.push(middleware);
    }

    /**
     * Adds a middleware to the registry on the secondary layer which executes
     * after regular middleware layer has been applied.
     *
     * The method is to be invoked only before {@link #applyMiddleware()}.
     *
     * @param {Middleware} middleware - A Redux middleware.
     * @returns {void}
     */
    register2(middleware: Middleware<*, *>) {
        this._elements2.push(middleware);
    }
}

/**
 * The public singleton instance of the MiddlewareRegistry class.
 */
export default new MiddlewareRegistry();

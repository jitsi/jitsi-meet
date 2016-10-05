import { applyMiddleware } from 'redux';

/**
 * A registry for Redux middleware, allowing features to register their
 * middleware without needing to create additional inter-feature dependencies.
 */
class MiddlewareRegistry {
    /**
     * Creates a MiddlewareRegistry instance.
     */
    constructor() {
        /**
         * The set of registered middleware.
         */
        this.middlewareRegistry = new Set();
    }

    /**
     * Applies all registered middleware into a store enhancer.
     * (@link http://redux.js.org/docs/api/applyMiddleware.html).
     *
     * @param {Function[]} additional - Any additional middleware that need to
     * be included (such as middleware from third-party modules).
     * @returns {Function}
     */
    applyMiddleware(...additional) {
        return applyMiddleware(
            ...this.middlewareRegistry,
            ...additional
        );
    }

    /**
     * Adds a middleware to the registry.
     *
     * The method is to be invoked only before {@link #applyMiddleware()}.
     *
     * @param {Function} middleware - A Redux middleware.
     * @returns {void}
     */
    register(middleware) {
        this.middlewareRegistry.add(middleware);
    }
}

/**
 * The public singleton instance of the MiddlewareRegistry class.
 */
export default new MiddlewareRegistry();

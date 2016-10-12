/**
 * Object describing application route.
 *
 * @typedef {Object} Route
 * @property {Component} component - React Component constructor.
 * @property {string} path - URL route, required for web routing.
 */

/**
 * A registry for Navigator routes, allowing features to register themselves
 * without needing to create additional inter-feature dependencies.
 */
class RouteRegistry {
    /**
     * Initializes a new RouteRegistry instance.
     */
    constructor() {
        /**
         * The set of registered routes.
         *
         * @private
         */
        this._routeRegistry = new Set();
    }

    /**
     * Returns all registered routes.
     *
     * @returns {Route[]}
     */
    getRoutes() {
        // We use the destructuring operator to 'clone' the route object to
        // prevent modifications from outside (e.g. React Native's Navigator
        // extends it with additional properties).
        return [ ...this._routeRegistry ].map(r => {
            return { ...r };
        });
    }

    /**
     * Returns registered route by name if any.
     *
     * @param {Object} component - The React Component (class) of the route to
     * retrieve.
     * @returns {Route|null}
     */
    getRouteByComponent(component) {
        const route
            = [ ...this._routeRegistry ].find(r => r.component === component);

        // We use destructuring operator to 'clone' route object to prevent
        // modifications from outside (e.g. React Native's Navigator extends
        // it with some additional properties).
        return route ? { ...route } : null;
    }

    /**
     * Adds a route to this registry.
     *
     * @param {Route} route - Route definition object.
     * @returns {void}
     */
    register(route) {
        if (this._routeRegistry.has(route)) {
            throw new Error(`Route ${route.component} is registered already!`);
        }

        this._routeRegistry.add(route);
    }
}

/**
 * The public singleton instance of the RouteRegistry class.
 */
export default new RouteRegistry();

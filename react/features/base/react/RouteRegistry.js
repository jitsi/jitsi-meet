/* @flow */

import { Component } from 'react';

/**
 * Object describing application route.
 *
 * @typedef {Object} Route
 * @property {Component} component - React Component constructor.
 * @property {string} path - URL route, required for web routing.
 */
type Route = {
    component: Class<Component<*>>, // eslint-disable-line no-undef
    path: string
};

/**
 * A registry for Navigator routes, allowing features to register themselves
 * without needing to create additional inter-feature dependencies.
 */
class RouteRegistry {
    _elements: Array<Route>;

    /**
     * Initializes a new RouteRegistry instance.
     */
    constructor() {
        /**
         * The set of registered routes.
         *
         * @private
         * @type {Route[]}
         */
        this._elements = [];
    }

    /**
     * Determines whether two specific Routes are equal i.e. they describe one
     * and the same abstract route.
     *
     * @param {Object} a - The Route to compare to b.
     * @param {Object} b - The Route to compare to a.
     * @returns {boolean} True if the specified a and b describe one and the
     * same abstract route; otherwise, false.
     */
    areRoutesEqual(a: Route, b: Route) {
        if (a === b) { // reflexive
            return true;
        }
        if (!a) {
            return !b;
        }
        if (!b) {
            return !a;
        }

        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);

        return (
            aKeys.length === bKeys.length /* symmetric */
                && aKeys.every(key => a[key] === b[key]));
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
        return this._elements.map(r => {
            return { ...r };
        });
    }

    /* eslint-disable no-undef */

    /**
     * Returns registered route by name if any.
     *
     * @param {Component} component - The React Component (class) of the route
     * to retrieve.
     * @returns {Route|null}
     */
    getRouteByComponent(component: Class<Component<*>>) {

        /* eslint-enable no-undef */

        const route = this._elements.find(r => r.component === component);

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
    register(route: Route) {
        if (this._elements.includes(route)) {
            throw new Error(
                `Route ${String(route.component)} is registered already!`);
        }

        this._elements.push(route);
    }
}

/**
 * The public singleton instance of the RouteRegistry class.
 */
export default new RouteRegistry();

import { AtlasKitThemeProvider } from '@atlaskit/theme';
import React from 'react';

import '../../base/responsive-ui';
import { getLocationContextRoot } from '../../base/util';
import '../../chat';
import '../../room-lock';
import '../../video-layout';

import { AbstractApp } from './AbstractApp';

/**
 * Root application component.
 *
 * @extends AbstractApp
 */
export class App extends AbstractApp {
    /**
     * App component's property types.
     *
     * @static
     */
    static propTypes = AbstractApp.propTypes;

    /**
     * Initializes a new App instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            ...this.state,

            /**
             * The context root of window.location i.e. this Web App.
             *
             * @type {string}
             */
            windowLocationContextRoot: this._getWindowLocationContextRoot()
        };
    }

    /**
     * Overrides the parent method to inject {@link AtlasKitThemeProvider} as
     * the top most component.
     *
     * @override
     */
    _createElement(component, props) {
        return (
            <AtlasKitThemeProvider mode = 'dark'>
                { super._createElement(component, props) }
            </AtlasKitThemeProvider>
        );
    }

    /**
     * Gets a Location object from the window with information about the current
     * location of the document.
     *
     * @inheritdoc
     */
    getWindowLocation() {
        return window.location;
    }

    /**
     * Gets the context root of this Web App from window.location.
     *
     * @private
     * @returns {string} The context root of window.location i.e. this Web App.
     */
    _getWindowLocationContextRoot() {
        return getLocationContextRoot(this.getWindowLocation());
    }

    /**
     * Navigates to a specific Route (via platform-specific means).
     *
     * @param {Route} route - The Route to which to navigate.
     * @protected
     * @returns {void}
     */
    _navigate(route) {
        let path;

        if (route) {
            path = route.path;

            const store = this._getStore();

            // The syntax :room bellow is defined by react-router. It "matches a
            // URL segment up to the next /, ?, or #. The matched string is
            // called a param."
            path
                = path.replace(
                    /:room/g,
                    store.getState()['features/base/conference'].room);
            path = this._routePath2WindowLocationPathname(path);
        }

        // Navigate to the specified Route.
        const windowLocation = this.getWindowLocation();
        let promise;

        if (!route || windowLocation.pathname === path) {
            // The browser is at the specified path already and what remains is
            // to make this App instance aware of the route to be rendered at
            // the current location.

            // XXX Refer to the super's _navigate for an explanation why a
            // Promise is returned.
            promise = super._navigate(route);
        } else {
            // The browser must go to the specified location. Once the specified
            // location becomes current, the App will be made aware of the route
            // to be rendered at it.
            windowLocation.pathname = path;
        }

        return promise || Promise.resolve();
    }

    /**
     * Converts a specific Route path to a window.location.pathname.
     *
     * @param {string} path - A Route path to be converted to/represeted as a
     * window.location.pathname.
     * @private
     * @returns {string} A window.location.pathname-compatible representation of
     * the specified Route path.
     */
    _routePath2WindowLocationPathname(path) {
        let pathname = this.state.windowLocationContextRoot;

        pathname.endsWith('/') || (pathname += '/');
        pathname += path.startsWith('/') ? path.substring(1) : path;

        return pathname;
    }
}

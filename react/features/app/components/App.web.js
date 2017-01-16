import { appInit } from '../actions';
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
    static propTypes = AbstractApp.propTypes

    /**
     * Inits the app before component will mount.
     *
     * @inheritdoc
     */
    componentWillMount(...args) {
        super.componentWillMount(...args);

        this.props.store.dispatch(appInit());
    }

    /**
     * Gets a Location object from the window with information about the current
     * location of the document.
     *
     * @inheritdoc
     */
    _getWindowLocation() {
        return window.location;
    }

    /**
     * Navigates to a specific Route (via platform-specific means).
     *
     * @param {Route} route - The Route to which to navigate.
     * @protected
     * @returns {void}
     */
    _navigate(route) {
        let path = route.path;
        const store = this.props.store;

        // The syntax :room bellow is defined by react-router. It "matches a URL
        // segment up to the next /, ?, or #. The matched string is called a
        // param."
        path
            = path.replace(
                /:room/g,
                store.getState()['features/base/conference'].room);

        // Navigate to the specified Route.
        const windowLocation = this._getWindowLocation();

        if (windowLocation.pathname === path) {
            // The browser is at the specified path already and what remains is
            // to make this App instance aware of the route to be rendered at
            // the current location.
            super._navigate(route);
        } else {
            // The browser must go to the specified location. Once the specified
            // location becomes current, the App will be made aware of the route
            // to be rendered at it.
            windowLocation.pathname = path;
        }
    }
}

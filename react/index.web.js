import React from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import {
    routerMiddleware,
    routerReducer
} from 'react-router-redux';
import { compose, createStore } from 'redux';
import Thunk from 'redux-thunk';

import config from './config';
import { App } from './features/app';
import {
    MiddlewareRegistry,
    ReducerRegistry
} from './features/base/redux';

// Create combined reducer from all reducers in registry + routerReducer from
// 'react-router-redux' module (stores location updates from history).
// @see https://github.com/reactjs/react-router-redux#routerreducer.
const reducer = ReducerRegistry.combineReducers({
    routing: routerReducer
});

// Apply all registered middleware from the MiddlewareRegistry + additional
// 3rd party middleware:
// - Thunk - allows us to dispatch async actions easily. For more info
// @see https://github.com/gaearon/redux-thunk.
// - routerMiddleware - middleware from 'react-router-redux' module to track
// changes in browser history inside Redux state. For more information
// @see https://github.com/reactjs/react-router-redux.
let middleware = MiddlewareRegistry.applyMiddleware(
    Thunk,
    routerMiddleware(browserHistory));

// Try to enable Redux DevTools Chrome extension in order to make it available
// for the purposes of facilitating development.
let devToolsExtension;

if (typeof window === 'object'
        && (devToolsExtension = window.devToolsExtension)) {
    middleware = compose(middleware, devToolsExtension());
}

// Create Redux store with our reducer and middleware.
const store = createStore(reducer, middleware);

// Render the main Component.
ReactDOM.render(
    <App
        config = { config }
        store = { store }
        url = { window.location.toString() } />,
    document.getElementById('react'));

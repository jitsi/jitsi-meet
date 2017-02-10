import React, { Component } from 'react';

import { App } from './App';

/**
 * React component for root component.
 *
 * @class Root
 * @extends Component
 */
export default class Root extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <App />
        );
    }
}

import React, { Component } from 'react';

/**
 * Implements a React/Web {@link Component} for displaying text similar to React
 * Native's {@code Text} in order to faciliate cross-platform source code.
 *
 * @extends Component
 */
export default class Text extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return React.createElement('span', this.props);
    }
}

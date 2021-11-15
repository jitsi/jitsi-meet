import React, { Component } from 'react';

/**
 * Implements a React/Web {@link Component} for displaying image
 * in order to facilitate cross-platform source code.
 *
 * @augments Component
 */
export default class Image extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return React.createElement('img', this.props);
    }
}

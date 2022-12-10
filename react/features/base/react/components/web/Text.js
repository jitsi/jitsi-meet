import React, { Component } from 'react';

import { getFixedPlatformStyle } from '../../../styles';

/**
 * Implements a React/Web {@link Component} for displaying text similar to React
 * Native's {@code Text} in order to facilitate cross-platform source code.
 *
 * @augments Component
 */
export default class Text extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // eslint-disable-next-line react/prop-types
        const _style = getFixedPlatformStyle(this.props.style);

        return React.createElement('span', {
            ...this.props,
            style: _style
        });
    }
}

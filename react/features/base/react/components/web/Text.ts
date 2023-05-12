import React, { Component } from 'react';

import { StyleType, getFixedPlatformStyle } from '../../../styles/functions.web';

/**
 * Implements a React/Web {@link Component} for displaying text similar to React
 * Native's {@code Text} in order to facilitate cross-platform source code.
 *
 * @augments Component
 */
export default class Text extends Component<React.HTMLProps<HTMLSpanElement>> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // eslint-disable-next-line react/prop-types
        const _style = getFixedPlatformStyle(this.props.style as StyleType);

        return React.createElement('span', {
            ...this.props,
            style: _style
        });
    }
}

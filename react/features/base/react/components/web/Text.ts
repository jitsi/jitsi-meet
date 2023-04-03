import React, { Component } from 'react';

import { getFixedPlatformStyle } from '../../../styles/functions.web';

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
        // @ts-ignore
        const _style = getFixedPlatformStyle(this.props.style);

        return React.createElement('span', {
            ...this.props,
            style: _style
        });
    }
}

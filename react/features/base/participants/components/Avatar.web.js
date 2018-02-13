// @flow

import React, { Component } from 'react';

/**
 * The type of the React {@link Component} props of {@link Avatar}.
 */
type Props = {

    /**
     * The URI of the {@link Avatar}.
     */
    uri: string
};

/**
 * Implements an avatar as a React/Web {@link Component}.
 */
export default class Avatar extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        // Propagate all props of this Avatar but the ones consumed by this
        // Avatar to the img it renders.

        // eslint-disable-next-line no-unused-vars
        const { uri, ...props } = this.props;

        return (
            <img
                { ...props }
                src = { uri } />
        );
    }
}

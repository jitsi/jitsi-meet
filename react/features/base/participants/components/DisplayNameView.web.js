// @flow

import React, { Component } from 'react';

/**
 * The type of the React {@link Component} props of {@link DisplayNameView}.
 */
type Props = {

    /**
     * The name of the {@link DisplayNameView}.
     */
    displayName: string
};

/**
 * Implements an avatar as a React/Web {@link Component}.
 */
export default class DisplayNameView extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        // Propagate all props of this Avatar but the ones consumed by this
        // Avatar to the img it renders.

        // eslint-disable-next-line no-unused-vars
        const { displayName, ...props } = this.props;

        return (
            <span
                class = 'speakerDisplayName'
                { ...props } >
                { displayName }
            </span>
            
        );
    }
}

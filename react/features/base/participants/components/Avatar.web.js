import React, { Component } from 'react';

/**
 * Implements an avatar as a React/Web {@link Component}.
 */
export default class Avatar extends Component {
    /**
     * Avatar component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The URI of the {@link Avatar}.
         *
         * @type {string}
         */
        uri: React.PropTypes.string
    };

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

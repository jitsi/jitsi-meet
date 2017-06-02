import React, { Component } from 'react';

/**
 * Display a participant avatar.
 */
export default class Avatar extends Component {
    /**
     * Avatar component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The URL for the avatar.
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
        return <img src = { this.props.uri } />;
    }
}

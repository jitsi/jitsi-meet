import React, { Component } from 'react';

/**
 * React {@code Component} responsible for displaying other components as a menu
 * for manipulating remote participant state.
 *
 * @extends {Component}
 */
export default class RemoteVideoMenu extends Component {
    /**
     * {@code RemoteVideoMenu}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The components to place as the body of the {@code RemoteVideoMenu}.
         */
        children: React.PropTypes.node,

        /**
         * The id attribute to be added to the component's DOM for retrieval
         * when querying the DOM. Not used directly by the component.
         */
        id: React.PropTypes.string
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ul
                className = 'popupmenu'
                id = { this.props.id }>
                { this.props.children }
            </ul>
        );
    }
}

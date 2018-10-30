/* @flow */

import React, { Component } from 'react';

/**
 * The type of the React {@code Component} props of {@link RemoteVideoMenu}.
 */
type Props = {

    /**
     * The components to place as the body of the {@code RemoteVideoMenu}.
     */
    children: React$Node,

    /**
     * The id attribute to be added to the component's DOM for retrieval when
     * querying the DOM. Not used directly by the component.
     */
    id: string
};

/**
 * React {@code Component} responsible for displaying other components as a menu
 * for manipulating remote participant state.
 *
 * @extends {Component}
 */
export default class RemoteVideoMenu extends Component<Props> {
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

// @flow

import React, { Component } from 'react';

type Props = {

    /**
     * The icon class to use for displaying an icon before the link text.
     */
    icon: string,

    /**
     * The callback to invoke when {@code OverflowMenuItem} is clicked.
     */
    onClick: Function,

    /**
     * The text to display in the {@code OverflowMenuItem}.
     */
    text: string
};

/**
 * A React {@code Component} for displaying a link to interact with other
 * features of the application.
 *
 * @extends Component
 */
class OverflowMenuItem extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <li
                className = 'overflow-menu-item'
                onClick = { this.props.onClick }>
                <span className = 'overflow-menu-item-icon'>
                    <i className = { this.props.icon } />
                </span>
                { this.props.text }
            </li>
        );
    }
}

export default OverflowMenuItem;

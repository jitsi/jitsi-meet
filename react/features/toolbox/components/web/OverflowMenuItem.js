import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * A React {@code Component} for displaying a link to interact with other
 * features of the application.
 *
 * @extends Component
 */
class OverflowMenuItem extends Component {
    /**
     * {@code OverflowMenuItem} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * A succinct description of what the item does. Used by accessibility
         * tools and torture tests.
         */
        accessibilityLabel: PropTypes.string,

        /**
         * The icon class to use for displaying an icon before the link text.
         */
        icon: PropTypes.string,

        /**
         * The callback to invoke when {@code OverflowMenuItem} is clicked.
         */
        onClick: PropTypes.func,

        /**
         * The text to display in the {@code OverflowMenuItem}.
         */
        text: PropTypes.string
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <li
                aria-label = { this.props.accessibilityLabel }
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

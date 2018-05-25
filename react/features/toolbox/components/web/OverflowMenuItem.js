import Tooltip from '@atlaskit/tooltip';
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
     * Default values for {@code OverflowMenuItem} component's properties.
     *
     * @static
     */
    static defaultProps = {
        tooltipPosition: 'left',
        disabled: false
    };

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
         * Whether menu item is disabled or not.
         */
        disabled: PropTypes.bool,

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
        text: PropTypes.string,

        /**
         * The text to display in the tooltip.
         */
        tooltip: PropTypes.string,

        /**
         * From which direction the tooltip should appear, relative to the
         * button.
         */
        tooltipPosition: PropTypes.string
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        let className = 'overflow-menu-item';

        className += this.props.disabled ? ' disabled' : '';

        return (
            <li
                aria-label = { this.props.accessibilityLabel }
                className = { className }
                onClick = { this.props.disabled ? null : this.props.onClick }>
                <span className = 'overflow-menu-item-icon'>
                    <i className = { this.props.icon } />
                </span>
                { this.props.tooltip
                    ? <Tooltip
                        content = { this.props.tooltip }
                        position = { this.props.tooltipPosition }>
                        <span>{ this.props.text }</span>
                    </Tooltip>
                    : this.props.text }
            </li>
        );
    }
}

export default OverflowMenuItem;

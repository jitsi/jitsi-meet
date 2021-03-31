// @flow

import React, { Component } from 'react';

import { Icon } from '../../../icons';
import { Tooltip } from '../../../tooltip';

/**
 * The type of the React {@code Component} props of {@link OverflowMenuItem}.
 */
type Props = {

    /**
     * A succinct description of what the item does. Used by accessibility tools
     * and torture tests.
     */
    accessibilityLabel: string,

    /**
     * Whether menu item is disabled or not.
     */
    disabled: boolean,

    /**
     * A React Element to display at the end of {@code OverflowMenuItem}.
     */
    elementAfter?: React$Node,

    /**
     * The icon class to use for displaying an icon before the link text.
     */
    icon: Object,

    /**
     * Id of the icon to be rendered.
     */
    iconId?: string,

    /**
     * The callback to invoke when {@code OverflowMenuItem} is clicked.
     */
    onClick: Function,

    /**
     * The text to display in the {@code OverflowMenuItem}.
     */
    text: string,

    /**
     * The text to display in the tooltip.
     */
    tooltip?: string,

    /**
     * From which direction the tooltip should appear, relative to the button.
     */
    tooltipPosition: string
};

/**
 * A React {@code Component} for displaying a link to interact with other
 * features of the application.
 *
 * @extends Component
 */
class OverflowMenuItem extends Component<Props> {
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
     * Initializes a new {@code OverflowMenuItem} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onKeyPress = this._onKeyPress.bind(this);
    }

    _onKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e) {
        if (!this.props.disabled && this.props.onClick && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            this.props.onClick();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { accessibilityLabel, disabled, elementAfter, icon, iconId, onClick } = this.props;

        let className = 'overflow-menu-item';

        className += this.props.disabled ? ' disabled' : '';

        return (
            <li
                aria-disabled = { disabled }
                aria-label = { accessibilityLabel }
                className = { className }
                onClick = { disabled ? null : onClick }
                onKeyPress = { this._onKeyPress }
                role = 'menuitem'
                tabIndex = { 0 }>
                <span className = 'overflow-menu-item-icon'>
                    <Icon
                        id = { iconId }
                        src = { icon } />
                </span>
                { this._renderText() }
                {
                    elementAfter || null
                }
            </li>
        );
    }

    /**
     * Renders the text label to display in the {@code OverflowMenuItem}.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderText() {
        const textElement = (
            <span className = 'overflow-menu-item-text'>
                { this.props.text }
            </span>
        );

        if (this.props.tooltip) {
            return (
                <Tooltip
                    content = { this.props.tooltip }
                    position = { this.props.tooltipPosition }>
                    { textElement }
                </Tooltip>
            );
        }

        return textElement;
    }
}

export default OverflowMenuItem;

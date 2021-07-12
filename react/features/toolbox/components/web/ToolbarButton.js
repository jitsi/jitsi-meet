/* @flow */

import React from 'react';

import { Icon } from '../../../base/icons';
import { Tooltip } from '../../../base/tooltip';
import AbstractToolbarButton from '../AbstractToolbarButton';
import type { Props as AbstractToolbarButtonProps }
    from '../AbstractToolbarButton';

/**
 * The type of the React {@code Component} props of {@link ToolbarButton}.
 */
export type Props = AbstractToolbarButtonProps & {

    /**
     * The text to display in the tooltip.
     */
    tooltip: string,

    /**
     * From which direction the tooltip should appear, relative to the
     * button.
     */
    tooltipPosition: string,

    /**
     * keyDown handler
     */
    onKeyDown?: Function
};

/**
 * Represents a button in the toolbar.
 *
 * @extends AbstractToolbarButton
 */
class ToolbarButton extends AbstractToolbarButton<Props> {
    /**
     * Default values for {@code ToolbarButton} component's properties.
     *
     * @static
     */
    static defaultProps = {
        tooltipPosition: 'top'
    };

    /**
     * Initializes a new {@code ToolbarButton} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onKeyPress = this._onKeyPress.bind(this);
        this._onClick = this._onClick.bind(this);
    }

    _onKeyPress: (Object) => void;

    /**
     * Handles 'Enter' and Space key on the button to trigger onClick for accessibility.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyPress(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.props.onClick();
        }
    }
    _onClick: (Object) => void;

    /**
     * Handles button click.
     *
     * @param {Object} e - The key event.
     * @private
     * @returns {void}
     */
    _onClick(e) {
        this.props.onClick(e);

        // blur after click to release focus from button to allow PTT.
        e && e.currentTarget && e.currentTarget.blur();
    }

    /**
     * Renders the button of this {@code ToolbarButton}.
     *
     * @param {Object} children - The children, if any, to be rendered inside
     * the button. Presumably, contains the icon of this {@code ToolbarButton}.
     * @protected
     * @returns {ReactElement} The button of this {@code ToolbarButton}.
     */
    _renderButton(children) {
        return (
            <div
                aria-label = { this.props.accessibilityLabel }
                aria-pressed = { this.props.toggled }
                className = 'toolbox-button'
                onClick = { this._onClick }
                onKeyDown = { this.props.onKeyDown }
                onKeyPress = { this._onKeyPress }
                role = 'button'
                tabIndex = { 0 }>
                { this.props.tooltip
                    ? <Tooltip
                        content = { this.props.tooltip }
                        position = { this.props.tooltipPosition }>
                        { children }
                    </Tooltip>
                    : children }
            </div>
        );
    }

    /**
     * Renders the icon of this {@code ToolbarButton}.
     *
     * @inheritdoc
     */
    _renderIcon() {
        return (
            <div className = { `toolbox-icon ${this.props.toggled ? 'toggled' : ''}` }>
                <Icon src = { this.props.icon } />
            </div>
        );
    }
}

export default ToolbarButton;

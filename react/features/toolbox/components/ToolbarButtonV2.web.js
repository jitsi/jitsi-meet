// @flow

import Tooltip from '@atlaskit/tooltip';
import React from 'react';

import AbstractToolbarButton from './AbstractToolbarButton';
import type {
    Props as AbstractToolbarButtonProps
} from './AbstractToolbarButton';

/**
 * The type of the React {@link Component} props of {@link ToolbarButtonV2}.
 */
type Props = AbstractToolbarButtonProps & {

    /**
     * The text to display in the tooltip.
     */
    tooltip: string,

    /**
     * From which direction the tooltip should appear, relative to the button.
     */
    tooltipPosition: string
};

/**
 * Represents a button in the toolbar.
 *
 * @extends AbstractToolbarButton
 */
class ToolbarButtonV2 extends AbstractToolbarButton<Props> {
    /**
     * Default values for {@code ToolbarButtonV2} component's properties.
     *
     * @static
     */
    static defaultProps = {
        tooltipPosition: 'top'
    };

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
                className = 'toolbox-button'
                onClick = { this.props.onClick }>
                <Tooltip
                    description = { this.props.tooltip }
                    position = { this.props.tooltipPosition }>
                    { children }
                </Tooltip>
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
            <div className = 'toolbox-icon'>
                <i className = { this.props.iconName } />
            </div>
        );
    }
}

export default ToolbarButtonV2;

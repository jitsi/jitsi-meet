import Tooltip from '@atlaskit/tooltip';
import PropTypes from 'prop-types';
import React from 'react';

import AbstractToolbarButton from '../AbstractToolbarButton';

/**
 * Represents a button in the toolbar.
 *
 * @extends AbstractToolbarButton
 */
class ToolbarButton extends AbstractToolbarButton {
    /**
     * Default values for {@code ToolbarButton} component's properties.
     *
     * @static
     */
    static defaultProps = {
        tooltipPosition: 'top'
    };

    /**
     * {@code ToolbarButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractToolbarButton.propTypes,

        /**
         * The text to display in the tooltip.
         */
        tooltip: PropTypes.string,

        /**
         * From which direction the tooltip should appear, relative to the
         * button.
         */
        tooltipPosition: PropTypes.string
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
                className = 'toolbox-button'
                onClick = { this.props.onClick }>
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
            <div className = 'toolbox-icon'>
                <i className = { this.props.iconName } />
            </div>
        );
    }
}

export default ToolbarButton;

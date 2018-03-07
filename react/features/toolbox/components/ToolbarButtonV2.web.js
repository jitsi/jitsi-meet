import Tooltip from '@atlaskit/tooltip';
import React from 'react';

import AbstractToolbarButton from './AbstractToolbarButton';

/**
 * Represents a button in {@link Toolbar}.
 *
 * @extends AbstractToolbarButton
 */
class ToolbarButtonV2 extends AbstractToolbarButton {
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
                className = 'toolbox-button'
                onClick = { this.props.onClick }>
                <Tooltip description = { this.props.tooltip }>
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

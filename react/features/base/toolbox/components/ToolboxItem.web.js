// @flow

import Tooltip from '@atlaskit/tooltip';
import React from 'react';

import AbstractToolboxItem from './AbstractToolboxItem';
import type { Props } from './AbstractToolboxItem';

/**
 * Web implementation of {@code AbstractToolboxItem}.
 */
export default class ToolboxItem extends AbstractToolboxItem<Props> {
    /**
     * Handles rendering of the actual item. If the label is being shown, which
     * is controlled with the `showLabel` prop, the item is rendered for its
     * display in an overflow menu, otherwise it will only have an icon, which
     * can be displayed on any toolbar.
     *
     * @protected
     * @returns {ReactElement}
     */
    _renderItem() {
        const {
            accessibilityLabel,
            onClick,
            showLabel
        } = this.props;
        const props = {
            'aria-label': accessibilityLabel,
            className: showLabel ? 'overflow-menu-item' : 'toolbox-button',
            onClick
        };
        const elementType = showLabel ? 'li' : 'div';
        // eslint-disable-next-line no-extra-parens
        const children = (

            // $FlowFixMe
            <React.Fragment>
                { this._renderIcon() }
                { showLabel && this.label }
            </React.Fragment>
        );

        return React.createElement(elementType, props, children);
    }

    /**
     * Helper function to render the item's icon.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderIcon() {
        const { iconName, tooltipPosition, showLabel } = this.props;
        const icon = <i className = { iconName } />;
        const elementType = showLabel ? 'span' : 'div';
        const className
            = showLabel ? 'overflow-menu-item-icon' : 'toolbox-icon';
        const iconWrapper
            = React.createElement(elementType, { className }, icon);
        const tooltip = this.tooltip;
        const useTooltip = !showLabel && tooltip && tooltip.length > 0;

        if (useTooltip) {
            return (
                <Tooltip
                    description = { tooltip }
                    position = { tooltipPosition }>
                    { iconWrapper }
                </Tooltip>
            );
        }

        return iconWrapper;
    }
}

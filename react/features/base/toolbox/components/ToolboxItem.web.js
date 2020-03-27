// @flow

import Tooltip from '@atlaskit/tooltip';
import React, { Fragment } from 'react';

import { Icon } from '../../icons';

import AbstractToolboxItem from './AbstractToolboxItem';
import type { Props } from './AbstractToolboxItem';

/**
 * Web implementation of {@code AbstractToolboxItem}.
 */
export default class ToolboxItem extends AbstractToolboxItem<Props> {
    /**
     * Initializes a new {@code ToolboxItem} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
    }

    _onKeyDown: (Object) => void;

    /**
     * Handles 'Enter' key on the button to trigger onClick for accessibility.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyDown(event) {
        // If the event coming to the dialog has been subject to preventDefault
        // we don't handle it here.
        if (event.defaultPrevented) {
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            this.props.onClick();
        } else if (event.key === ' ') {
            // Space triggers button onKeyUp but we need to prevent PTT here
            event.preventDefault();
            event.stopPropagation();
        }
    }

    _onKeyUp: (Object) => void;

    /**
     * Handles ' ' (Space) key on the button to trigger onClick for
     * accessibility.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyUp(event) {
        // If the event coming to the dialog has been subject to preventDefault
        // we don't handle it here.
        if (event.defaultPrevented) {
            return;
        }

        if (event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            this.props.onClick();
        }
    }

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
            disabled,
            elementAfter,
            onClick,
            showLabel,
            tooltipPosition,
            toggled
        } = this.props;
        const className = showLabel ? 'overflow-menu-item' : 'toolbox-button';
        const props = {
            'aria-pressed': toggled,
            'aria-disabled': disabled,
            'aria-label': this.accessibilityLabel,
            className: className + (disabled ? ' disabled' : ''),
            onClick: disabled ? undefined : onClick,
            onKeyDown: this._onKeyDown,
            onKeyUp: this._onKeyUp,
            tabIndex: 0,
            role: 'button'
        };

        const elementType = showLabel ? 'li' : 'div';
        const useTooltip = this.tooltip && this.tooltip.length > 0;
        let children = (
            <Fragment>
                { this._renderIcon() }
                { showLabel && <span>
                    { this.label }
                </span> }
                { elementAfter }
            </Fragment>
        );

        if (useTooltip) {
            children = (
                <Tooltip
                    content = { this.tooltip }
                    position = { tooltipPosition }>
                    { children }
                </Tooltip>
            );
        }

        return React.createElement(elementType, props, children);
    }

    /**
     * Helper function to render the item's icon.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderIcon() {
        const { disabled, icon, showLabel, toggled } = this.props;
        const iconComponent = <Icon src = { icon } />;
        const elementType = showLabel ? 'span' : 'div';
        const className = `${showLabel ? 'overflow-menu-item-icon' : 'toolbox-icon'} ${
            toggled ? 'toggled' : ''} ${disabled ? 'disabled' : ''}`;

        return React.createElement(elementType, { className }, iconComponent);
    }
}

import React, { Fragment } from 'react';

import Icon from '../../icons/components/Icon';
import Tooltip from '../../tooltip/components/Tooltip';
import ContextMenuItem from '../../ui/components/web/ContextMenuItem';

import AbstractToolboxItem from './AbstractToolboxItem';
import type { IProps as AbstractToolboxItemProps } from './AbstractToolboxItem';

interface IProps extends AbstractToolboxItemProps {

    /**
     * The button's background color.
     */
    backgroundColor?: string;

    /**
     * Whether or not the item is displayed in a context menu.
     */
    contextMenu?: boolean;

    /**
     * Whether the button open a menu or not.
     */
    isMenuButton?: boolean;

    /**
    * On key down handler.
    */
    onKeyDown: (e?: React.KeyboardEvent) => void;
}

/**
 * Web implementation of {@code AbstractToolboxItem}.
 */
export default class ToolboxItem extends AbstractToolboxItem<IProps> {
    /**
     * Initializes a new {@code ToolboxItem} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onKeyPress = this._onKeyPress.bind(this);
    }

    /**
     * Handles 'Enter' and Space key on the button to trigger onClick for accessibility.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyPress(event?: React.KeyboardEvent) {
        if (event?.key === 'Enter') {
            event.preventDefault();
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
            backgroundColor,
            contextMenu,
            isMenuButton,
            disabled,
            elementAfter,
            icon,
            onClick,
            onKeyDown,
            showLabel,
            tooltipPosition,
            toggled
        } = this.props;
        const className = showLabel ? 'overflow-menu-item' : 'toolbox-button';
        const buttonAttribute = isMenuButton ? 'aria-expanded' : 'aria-pressed';
        const props = {
            [buttonAttribute]: toggled,
            'aria-disabled': disabled,
            'aria-label': this.accessibilityLabel,
            className: className + (disabled ? ' disabled' : ''),
            onClick: disabled ? undefined : onClick,
            onKeyDown: disabled ? undefined : onKeyDown,
            onKeyPress: this._onKeyPress,
            tabIndex: 0,
            role: 'button'
        };

        const elementType = showLabel ? 'li' : 'div';
        const useTooltip = this.tooltip && this.tooltip.length > 0;

        if (contextMenu) {
            return (
                <ContextMenuItem
                    accessibilityLabel = { this.accessibilityLabel }
                    backgroundColor = { backgroundColor }
                    disabled = { disabled }
                    icon = { icon }
                    onClick = { onClick }
                    onKeyDown = { onKeyDown }
                    onKeyPress = { this._onKeyPress }
                    text = { this.label } />
            );
        }
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
                    content = { this.tooltip ?? '' }
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
        const { backgroundColor, customClass, disabled, icon, showLabel, toggled } = this.props;
        const iconComponent = (<Icon
            size = { showLabel ? undefined : 24 }
            src = { icon } />);
        const elementType = showLabel ? 'span' : 'div';
        const className = `${showLabel ? 'overflow-menu-item-icon' : 'toolbox-icon'} ${
            toggled ? 'toggled' : ''} ${disabled ? 'disabled' : ''} ${customClass ?? ''}`;
        const style = backgroundColor && !showLabel ? { backgroundColor } : {};

        return React.createElement(elementType, {
            className,
            style
        }, iconComponent);
    }
}
